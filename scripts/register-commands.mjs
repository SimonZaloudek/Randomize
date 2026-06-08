// One-time (re-run on change) Discord slash-command registration.
//
// This is NOT part of the deployed site - it's a local Node script (Node 18+,
// uses built-in fetch, zero dependencies) that tells Discord which commands
// exist. Run it whenever you add/change a command in functions/api/discord.js.
//
// Usage (PowerShell):
//   $env:DISCORD_APP_ID="...";   $env:DISCORD_BOT_TOKEN="..."
//   # optional - register to ONE server for instant testing (global takes ~1h):
//   $env:DISCORD_GUILD_ID="..."
//   node scripts/register-commands.mjs
//
// Option types: 3=STRING, 4=INTEGER, 5=BOOLEAN.

const APP_ID = process.env.DISCORD_APP_ID;
const TOKEN  = process.env.DISCORD_BOT_TOKEN;
const GUILD  = process.env.DISCORD_GUILD_ID; // optional: instant, per-server

const STRING = 3, INTEGER = 4, BOOLEAN = 5, NUMBER = 10;

const commands = [
  { name: "coinflip", description: "Flip a coin - heads or tails" },

  {
    name: "dice", description: "Roll dice",
    options: [
      { name: "count", description: "How many dice (1-5)", type: INTEGER, min_value: 1, max_value: 5 },
      { name: "sides", description: "Sides per die (default 6)", type: INTEGER, min_value: 2, max_value: 1000 },
    ],
  },

  {
    name: "number", description: "A random number in a range",
    options: [
      { name: "min", description: "Minimum (default 1)", type: INTEGER },
      { name: "max", description: "Maximum (default 100)", type: INTEGER },
    ],
  },

  {
    name: "lottery", description: "Draw lottery numbers",
    options: [
      { name: "draw", description: "How many to draw (default 6)", type: INTEGER, min_value: 1, max_value: 100 },
      { name: "of", description: "Out of how many (default 49)", type: INTEGER, min_value: 2, max_value: 1000 },
    ],
  },

  {
    name: "multiple", description: "Several random numbers at once",
    options: [
      { name: "count", description: "How many (default 5)", type: INTEGER, min_value: 1, max_value: 100 },
      { name: "min", description: "Minimum (default 1)", type: INTEGER },
      { name: "max", description: "Maximum (default 100)", type: INTEGER },
      { name: "unique", description: "No repeats", type: BOOLEAN },
    ],
  },

  {
    name: "pin", description: "Generate a numeric PIN",
    options: [{ name: "digits", description: "Length (3-12, default 4)", type: INTEGER, min_value: 3, max_value: 12 }],
  },

  {
    name: "date", description: "A random date in a range",
    options: [
      { name: "from", description: "Start date YYYY-MM-DD (default 2000-01-01)", type: STRING },
      { name: "to", description: "End date YYYY-MM-DD (default today)", type: STRING },
    ],
  },

  {
    name: "shuffle", description: "Shuffle a list into random order",
    options: [{ name: "items", description: "Comma- or newline-separated list", type: STRING, required: true }],
  },

  {
    name: "pick", description: "Pick one from a list (supports 'item weight:N')",
    options: [{ name: "items", description: "Comma- or newline-separated list", type: STRING, required: true }],
  },

  {
    name: "password", description: "Generate a strong password",
    options: [
      { name: "length", description: "Length (4-128, default 16)", type: INTEGER, min_value: 4, max_value: 128 },
      { name: "upper", description: "Include A-Z (default on)", type: BOOLEAN },
      { name: "lower", description: "Include a-z (default on)", type: BOOLEAN },
      { name: "digits", description: "Include 0-9 (default on)", type: BOOLEAN },
      { name: "symbols", description: "Include symbols (default on)", type: BOOLEAN },
    ],
  },

  {
    name: "token", description: "Generate a random token",
    options: [
      { name: "length", description: "Length (1-256, default 32)", type: INTEGER, min_value: 1, max_value: 256 },
      {
        name: "charset", description: "Character set (default alphanumeric)", type: STRING,
        choices: [
          { name: "alphanumeric", value: "alphanumeric" },
          { name: "hex", value: "hex" },
          { name: "base64", value: "base64" },
        ],
      },
    ],
  },

  { name: "emoji", description: "Get a random emoji" },

  {
    name: "wheel", description: "Spin a wheel of options",
    options: [{ name: "options", description: "2-16 options, comma- or newline-separated", type: STRING, required: true }],
  },

  {
    name: "groups", description: "Shuffle people into random groups",
    options: [
      { name: "names", description: "Comma- or newline-separated names", type: STRING, required: true },
      {
        name: "mode", description: "Split by number of groups, or by group size", type: STRING,
        choices: [
          { name: "by group count", value: "count" },
          { name: "by group size", value: "size" },
        ],
      },
      { name: "value", description: "Group count or size (1-15, default 2)", type: INTEGER, min_value: 1, max_value: 15 },
    ],
  },

  {
    name: "rps", description: "Run the Rock-Paper-Scissors arena battle",
    options: [
      { name: "rock", description: "Rocks (0-30, default 10)", type: INTEGER, min_value: 0, max_value: 30 },
      { name: "paper", description: "Papers (0-30, default 10)", type: INTEGER, min_value: 0, max_value: 30 },
      { name: "scissors", description: "Scissors (0-30, default 10)", type: INTEGER, min_value: 0, max_value: 30 },
    ],
  },

  {
    name: "movie", description: "Random movie or TV show",
    options: [
      {
        name: "type", description: "Movies or TV (default movies)", type: STRING,
        choices: [{ name: "movie", value: "movie" }, { name: "tv", value: "tv" }],
      },
      { name: "min_rating", description: "Minimum rating, 0 to 10", type: NUMBER, min_value: 0, max_value: 10 },
    ],
  },

  {
    name: "game", description: "Random video game",
    options: [
      { name: "min_rating", description: "Minimum rating, 0 to 100", type: INTEGER, min_value: 0, max_value: 100 },
      { name: "from_year", description: "Earliest release year", type: INTEGER, min_value: 1970, max_value: 2100 },
      { name: "to_year", description: "Latest release year", type: INTEGER, min_value: 1970, max_value: 2100 },
    ],
  },

  {
    name: "song", description: "Random song",
    options: [
      { name: "artist", description: "Limit to one artist", type: STRING },
      { name: "no_explicit", description: "Exclude explicit tracks", type: BOOLEAN },
    ],
  },
];

// process.exitCode (not process.exit) lets Node drain fetch handles cleanly -
// avoids the libuv assertion crash on Windows when exiting mid-request.
async function main() {
  if (!APP_ID || !TOKEN) {
    console.error("Set DISCORD_APP_ID and DISCORD_BOT_TOKEN environment variables first.");
    process.exitCode = 1;
    return;
  }

  const url = GUILD
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const res = await fetch(url, {
    method: "PUT", // bulk overwrite - the list above becomes the full command set
    headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    console.error(`Failed (${res.status}): ${await res.text()}`);
    if (res.status === 403) {
      console.error("\n403 Missing Access usually means the bot isn't in that server yet.");
      console.error("Fix one of these:");
      console.error("  • Invite the bot with the applications.commands scope, then re-run, OR");
      console.error("  • Register globally: Remove-Item Env:\\DISCORD_GUILD_ID  (then re-run)");
    }
    process.exitCode = 1;
    return;
  }

  const registered = await res.json();
  console.log(`Registered ${registered.length} commands ${GUILD ? `to guild ${GUILD} (instant)` : "globally (~1h to appear)"}:`);
  console.log(registered.map(c => `  /${c.name}`).join("\n"));
}

main();
