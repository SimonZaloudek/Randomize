// POST /api/discord - Discord "HTTP interactions" endpoint.

import { incrementStat } from "./_stats.js";

// interaction
const PING = 1;
const APPLICATION_COMMAND = 2;

// response
const PONG = 1;
const CHANNEL_MESSAGE = 4;
const DEFERRED_MESSAGE = 5;             

const ACCENT = 0x8a6bff;                // dark purple
const SITE   = "https://userandomize.net";
const FOOTER = { text: "userandomize.net", icon_url: `${SITE}/brand/RANDLOGO2.png` };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DISCORD_PUBLIC_KEY) return json({ error: "Server not configured" }, 500);

  // Raw body text is required for signature verification - parsing then
  // re-stringifying would change the bytes and fail the check.
  const bodyText = await request.text();
  if (!(await verifySignature(request, bodyText, env.DISCORD_PUBLIC_KEY))) {
    return new Response("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(bodyText);

  if (interaction.type === PING) return json({ type: PONG });

  if (interaction.type === APPLICATION_COMMAND) {
    const name = interaction.data?.name;
    const opts = optionsToMap(interaction.data?.options);
    incrementStat(env, "discord");              // fire-and-forget; never blocks reply

    // instant commands answer right away
    if (COMMANDS[name]) {
      return json({ type: CHANNEL_MESSAGE, data: COMMANDS[name](opts) });
    }

    // API-backed commands are too slow for Discord's 3s window: ACK now
    // ("thinking..."), then edit the message with the result in the background.
    if (DEFERRED[name]) {
      const origin = new URL(request.url).origin;
      context.waitUntil(handleDeferred(env, origin, interaction, name, opts));
      return json({ type: DEFERRED_MESSAGE });
    }

    return reply("Sorry, I don't recognize that command.");
  }

  return json({ error: "Unsupported interaction type" }, 400);
}

// ---------------------------------------------------------------------------
// Command registry - name -> (opts) => Discord message data
// (exported for unit testing; Pages only ever calls onRequestPost)
// ---------------------------------------------------------------------------
export const COMMANDS = {
  coinflip: cmdCoinflip,
  dice:     cmdDice,
  number:   cmdNumber,
  lottery:  cmdLottery,
  multiple: cmdMultiple,
  pin:      cmdPin,
  date:     cmdDate,
  shuffle:  cmdShuffle,
  pick:     cmdPick,
  password: cmdPassword,
  token:    cmdToken,
  emoji:    cmdEmoji,
  wheel:    cmdWheel,
  groups:   cmdGroups,
  rps:      cmdRps,
};

// ---------------------------------------------------------------------------
// Coin & dice - sharp still of the actual result, rendered from the real page
// ---------------------------------------------------------------------------
function cmdCoinflip() {
  const heads = Math.random() < 0.5;
  return embed("Coin Flip", `The coin landed on **${heads ? "Heads" : "Tails"}**.`,
    `${SITE}/discord/coin-${heads ? "heads" : "tails"}.png`);
}

function cmdDice(o) {
  const count = clampInt(o.count, 1, 1, 5);     // page caps dice at 5
  const sides = clampInt(o.sides, 6, 2, 1000);
  const rolls = Array.from({ length: count }, () => randInt(1, sides));
  const total = rolls.reduce((a, b) => a + b, 0);

  // single d6 gets the rendered die face; everything else stays text
  if (count === 1 && sides === 6) {
    return embed("Dice Roll", `You rolled a **${total}**.`, `${SITE}/discord/die-${total}.png`);
  }

  const body = count === 1
    ? `You rolled a **${total}** on a ${sides}-sided die.`
    : `Rolls: ${rolls.join(", ")}\nTotal **${total}** (${count}d${sides}).`;
  return embed("Dice Roll", body);
}

// ---------------------------------------------------------------------------
// Number tools (port of NumberRandomizer)
// ---------------------------------------------------------------------------
function cmdNumber(o) {
  let min = intOr(o.min, 1), max = intOr(o.max, 100);
  if (min > max) [min, max] = [max, min];
  return embed("Random Number", `**${randInt(min, max)}**\n*between ${min} and ${max}*`);
}

function cmdLottery(o) {
  const max  = clampInt(o.of, 49, 2, 1000);
  const draw = clampInt(o.draw, 6, 1, max);
  const nums = pickUnique(1, max, draw).sort((a, b) => a - b);
  return embed("Lottery", `**${nums.join("   ")}**\n*${draw} numbers from 1 to ${max}*`);
}

function cmdMultiple(o) {
  const count  = clampInt(o.count, 5, 1, 100);
  let min = intOr(o.min, 1), max = intOr(o.max, 100);
  if (min > max) [min, max] = [max, min];
  const unique = o.unique === true;

  let nums;
  if (unique) {
    const span = max - min + 1;
    nums = pickUnique(min, max, Math.min(count, span));
  } else {
    nums = Array.from({ length: count }, () => randInt(min, max));
  }
  return embed("Multiple Numbers", `\`${nums.join("  ")}\`\n*${nums.length} numbers, ${min} to ${max}${unique ? ", no repeats" : ""}*`);
}

function cmdPin(o) {
  const len = clampInt(o.digits, 4, 3, 12);
  let pin = "";
  for (let i = 0; i < len; i++) pin += randInt(0, 9);
  return embed("PIN", `\`${pin}\``);
}

function cmdDate(o) {
  const today = new Date();
  const from = parseDate(o.from) ?? new Date(Date.UTC(2000, 0, 1));
  const to   = parseDate(o.to)   ?? today;
  const [a, b] = from <= to ? [from, to] : [to, from];
  const ms = a.getTime() + Math.random() * (b.getTime() - a.getTime());
  const d = new Date(ms);
  const txt = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  return embed("Random Date", `**${txt}**`);
}

// ---------------------------------------------------------------------------
// String / list tools (port of StringRandomizer)
// ---------------------------------------------------------------------------
function cmdShuffle(o) {
  const items = parseList(o.items);
  if (items.length < 2) return embed("Shuffle", "Give me at least two items, comma or newline separated.");
  shuffleInPlace(items);
  return embed("Shuffled", items.map((x, i) => `${i + 1}. ${x}`).join("\n"));
}

// Supports the page's optional `weight:N` syntax, otherwise uniform.
function cmdPick(o) {
  const raw = parseList(o.items);
  if (raw.length === 0) return embed("Pick", "Give me a comma or newline separated list.");

  const items = raw.map(line => {
    const m = line.match(/\s*weight:\s*(\d+(?:\.\d+)?)\s*$/i);
    if (m) return { label: line.slice(0, m.index).trim(), weight: Math.max(0, Number(m[1])) };
    return { label: line, weight: 1 };
  });

  const total = items.reduce((s, x) => s + x.weight, 0) || 1;
  let r = Math.random() * total;
  let chosen = items[items.length - 1];
  for (const it of items) { if ((r -= it.weight) < 0) { chosen = it; break; } }

  return embed("Picked", `**${chosen.label}**\n*from ${items.length} option${items.length === 1 ? "" : "s"}*`);
}

const PW_SETS = { upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lower: "abcdefghijklmnopqrstuvwxyz", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.<>?" };

function cmdPassword(o) {
  const len = clampInt(o.length, 16, 4, 128);
  // default: all sets on unless the user explicitly turned some off
  const pick = {
    upper:   o.upper   !== false,
    lower:   o.lower   !== false,
    digits:  o.digits  !== false,
    symbols: o.symbols === true ? true : (o.symbols === false ? false : true),
  };
  let pool = "";
  for (const k of Object.keys(PW_SETS)) if (pick[k]) pool += PW_SETS[k];
  if (!pool) return embed("Password", "Enable at least one character set.");

  const pw = randomFrom(pool, len);
  return embed("Password", `\`${pw}\``);
}

const TOKEN_SETS = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  hex: "0123456789abcdef",
  base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
};

function cmdToken(o) {
  const len = clampInt(o.length, 32, 1, 256);
  const pool = TOKEN_SETS[o.charset] || TOKEN_SETS.alphanumeric;
  return embed("Token", `\`${randomFrom(pool, len)}\``);
}

const EMOJIS = ["😀","😎","🥳","🤖","👻","🐱","🐶","🦊","🐼","🦄","🍕","🍩","🌮","🎲","🎸","🚀","🌈","⭐","🔥","💎","🍀","🎁","⚡","🌙","🎯","🏆","🎈","🪐","🦖","🐙"];

function cmdEmoji() {
  return embed("Random Emoji", `Your emoji is ${EMOJIS[randInt(0, EMOJIS.length - 1)]}`);
}

// ---------------------------------------------------------------------------
// Wheel - real winner (the spin animation stays on the site)
// ---------------------------------------------------------------------------
function cmdWheel(o) {
  const items = parseList(o.options);
  if (items.length < 2) return embed("Wheel", "Give me 2 to 16 options, comma or newline separated.");
  const list = items.slice(0, 16);
  const winner = list[randInt(0, list.length - 1)];
  // deep link opens the real wheel preset with these options and auto-spins
  const link = `${SITE}/wheel?options=${encodeURIComponent(list.join(","))}&go=true`;
  return card({
    title: "Wheel",
    description: `Winner: **${winner}**\n*from ${list.length} options* · [spin it live](${link})`,
    url: link,
  });
}

// ---------------------------------------------------------------------------
// Group shuffler (port of GroupShufflerCore)
// ---------------------------------------------------------------------------
function cmdGroups(o) {
  const people = parseList(o.names);
  if (people.length < 2) return embed("Groups", "Give me at least two names, comma or newline separated.");
  shuffleInPlace(people);

  const mode = o.mode === "size" ? "size" : "count";
  const value = clampInt(o.value, 2, 1, 15);

  let buckets;
  if (mode === "count") {
    const n = Math.min(value, people.length);
    buckets = Array.from({ length: n }, () => []);
    people.forEach((p, i) => buckets[i % n].push(p));   // round-robin = even sizes
  } else {
    buckets = [];
    for (let i = 0; i < people.length; i += value) buckets.push(people.slice(i, i + value));
  }

  return card({
    title: "Group Shuffle",
    description: `Shuffled **${people.length}** people into **${buckets.length}** group${buckets.length === 1 ? "" : "s"}.`,
    fields: buckets.map((members, i) => ({
      name: `Group ${i + 1}`,
      value: members.join("\n") || "(empty)",
      inline: true,
    })),
    url: `${SITE}/groupshuffler`,
  });
}

// ---------------------------------------------------------------------------
// RPS arena - the actual sim from rps.js, run headless to find the winner
// ---------------------------------------------------------------------------
const RPS_TYPES = ["rock", "paper", "scissors"];
const RPS_BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

function cmdRps(o) {
  const counts = {
    rock:     clampInt(o.rock, 10, 0, 30),
    paper:    clampInt(o.paper, 10, 0, 30),
    scissors: clampInt(o.scissors, 10, 0, 30),
  };
  if (counts.rock + counts.paper + counts.scissors < 2) {
    return embed("RPS Arena", "Need at least 2 fighters total.");
  }

  const { winner, conversions, resolved } = simulateArena(counts);

  const lineup = `Rock ${counts.rock}, Paper ${counts.paper}, Scissors ${counts.scissors}`;
  const verdict = resolved ? `**${cap(winner)} wins.**` : `**${cap(winner)} leads** (stalemate)`;
  // deep link opens the real arena with these counts and auto-starts the sim
  const link = `${SITE}/rps?rock=${counts.rock}&paper=${counts.paper}&scissors=${counts.scissors}&go=true`;
  return card({
    title: "RPS Arena",
    description: `${verdict}\n\nStarting lineup: ${lineup}\n${conversions} conversions · [watch the arena](${link})`,
    url: link,
  });
}

// Simulate the arena in-process until a winner emerges or we hit the step limit.
function simulateArena(counts) {
  const c = { rock: counts.rock, paper: counts.paper, scissors: counts.scissors };
  const total = c.rock + c.paper + c.scissors;
  const present = () => RPS_TYPES.filter(t => c[t] > 0);

  const pickFighter = () => {
    let r = randInt(1, total);                 // total is invariant (one in, one out)
    if ((r -= c.rock) <= 0) return "rock";
    if ((r -= c.paper) <= 0) return "paper";
    return "scissors";
  };

  let conversions = 0, guard = 0;
  const MAX = 100000;                           // safety net; O(1) steps keep this cheap
  while (present().length > 1 && guard++ < MAX) {
    const a = pickFighter(), b = pickFighter();
    if (a === b) continue;                      // same type, no fight
    const winner = RPS_BEATS[a] === b ? a : b;
    const loser  = winner === a ? b : a;
    c[winner]++; c[loser]--;
    conversions++;
  }

  const alive = present();
  if (alive.length === 1) return { winner: alive[0], conversions, resolved: true };
  const winner = RPS_TYPES.reduce((x, y) => (c[y] > c[x] ? y : x));
  return { winner, conversions, resolved: false };
}

// ---------------------------------------------------------------------------
// API-backed commands - these hit our backend and can take a while -> ACK
// ---------------------------------------------------------------------------
export const DEFERRED = { movie: buildMovie, game: buildGame, song: buildSong };

async function handleDeferred(env, origin, interaction, name, opts) {
  let data;
  try {
    data = await DEFERRED[name](origin, opts);
  } catch {
    data = { content: "Something went wrong fetching that. Please try again." };
  }
  await editOriginal(interaction, data);
}

// Replace the "thinking..." placeholder with the real result.
async function editOriginal(interaction, data) {
  const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
  await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

async function buildMovie(origin, opts) {
  const p = new URLSearchParams();
  if (opts.type === "tv") p.set("type", "tv");
  if (typeof opts.min_rating === "number") p.set("min_rating", String(opts.min_rating));
  const m = await apiJson(`${origin}/api/movies/random?${p}`);
  if (!m || m.error) return { content: noResult(m?.error) };

  return card({
    title: `${m.title}${m.year ? ` (${m.year})` : ""}`,
    description: clip(m.overview, 500) || m.tagline || "",
    fields: keep([
      m.genres?.length ? { name: "Genres", value: m.genres.join(", "), inline: true } : null,
      ratingLine(m.ratings) ? { name: "Ratings", value: ratingLine(m.ratings), inline: true } : null,
    ]),
    image: m.backdrop || m.poster,
    thumbnail: m.poster,
    url: m.links?.tmdb,
  });
}

async function buildGame(origin, opts) {
  const p = new URLSearchParams();
  if (Number.isInteger(opts.min_rating)) p.set("min_rating", String(opts.min_rating));
  if (Number.isInteger(opts.from_year))  p.set("from_year", String(opts.from_year));
  if (Number.isInteger(opts.to_year))    p.set("to_year", String(opts.to_year));
  const g = await apiJson(`${origin}/api/games/random?${p}`);
  if (!g || g.error) return { content: noResult(g?.error) };

  const platforms = (g.platforms || []).map(pl => pl.abbr || pl.name).slice(0, 6).join(", ");
  return card({
    title: `${g.name}${g.year ? ` (${g.year})` : ""}`,
    description: clip(g.summary, 500),
    fields: keep([
      g.genres?.length ? { name: "Genres", value: g.genres.join(", "), inline: true } : null,
      platforms ? { name: "Platforms", value: platforms, inline: true } : null,
      ratingLine(g.ratings) ? { name: "Ratings", value: ratingLine(g.ratings), inline: false } : null,
    ]),
    image: g.backdrop || g.cover,
    thumbnail: g.cover,
    url: g.igdbUrl,
  });
}

async function buildSong(origin, opts) {
  const p = new URLSearchParams();
  if (opts.artist) p.set("artist", String(opts.artist));
  if (opts.no_explicit === true) p.set("no_explicit", "1");
  const s = await apiJson(`${origin}/api/songs/random?${p}`);
  if (!s || s.error) return { content: noResult(s?.error) };

  const artists = (s.artists || []).map(a => a.name).join(", ");
  return card({
    title: s.title,
    description: artists ? `by **${artists}**` : "",
    fields: keep([
      s.album?.name ? { name: "Album", value: `${s.album.name}${s.year ? ` (${s.year})` : ""}`, inline: true } : null,
      msToClock(s.durationMs) ? { name: "Length", value: msToClock(s.durationMs), inline: true } : null,
    ]),
    thumbnail: s.album?.image,
    url: s.spotifyUrl,
  });
}

async function apiJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  return r.json().catch(() => null);
}

function ratingLine(ratings) {
  return (ratings || []).map(r => `${r.source} ${r.score}/${r.max}`).join("   ");
}
function clip(s, n) {
  s = (s || "").trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
function msToClock(ms) {
  if (!ms) return null;
  const sec = Math.round(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
function keep(fields) { const f = fields.filter(Boolean); return f.length ? f : undefined; }
function noResult(err) { return err ? `No result. (${err})` : "No result for those filters."; }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function optionsToMap(options) {
  const map = {};
  for (const o of options || []) map[o.name] = o.value;
  return map;
}

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function pickUnique(min, max, count) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  shuffleInPlace(pool);
  return pool.slice(0, count);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomFrom(pool, len) {
  let out = "";
  for (let i = 0; i < len; i++) out += pool[Math.floor(Math.random() * pool.length)];
  return out;
}

// accept both commas and newlines, trim, drop blanks
function parseList(s) {
  return String(s ?? "").split(/[\n,]/).map(x => x.trim()).filter(Boolean);
}

function intOr(v, fallback) { return Number.isInteger(v) ? v : fallback; }

function clampInt(v, fallback, min, max) {
  const n = Number.isInteger(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Shared embed builder: dark accent + logo footer, used by every command.
function card({ title, description, image, thumbnail, fields, url = SITE }) {
  const e = { title, color: ACCENT, footer: FOOTER, url };
  if (description) e.description = description;
  if (image) e.image = { url: image };
  if (thumbnail) e.thumbnail = { url: thumbnail };
  if (fields) e.fields = fields;
  return { embeds: [e] };
}

function embed(title, description, image) {
  return card({ title, description, image });
}

function reply(content) { return json({ type: CHANNEL_MESSAGE, data: { content } }); }

// ---------------------------------------------------------------------------
// Ed25519 signature verification (Discord requirement)
// ---------------------------------------------------------------------------
async function verifySignature(request, bodyText, publicKeyHex) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  if (!signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(publicKeyHex), { name: "Ed25519" }, false, ["verify"]);
    const message = new TextEncoder().encode(timestamp + bodyText);
    return await crypto.subtle.verify("Ed25519", key, hexToBytes(signature), message);
  } catch {
    return false;
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
