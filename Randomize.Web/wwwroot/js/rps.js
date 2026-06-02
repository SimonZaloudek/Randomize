// RPS arena sim. Cross-type collisions convert the loser, same-type bounces
// elastically. Round ends when one type remains.

(function () {
    const TYPES = ["rock", "paper", "scissors"];
    const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

    // swap to sprite paths once assets are dropped in wwwroot/img/rps/
    const GLYPHS = { rock: "🪨", paper: "📄", scissors: "✂️" };

    const RADIUS = 18;
    const BASE_SPEED = 60;
    const SEEK_STRENGTH = 0.7;
    const FLEE_STRENGTH = 0.9;
    const EFFECT_DURATION = 0.3;

    let canvas = null;
    let ctx = null;
    let dotnetRef = null;
    let entities = [];
    let effects = [];
    let running = false;
    let speed = 1;
    let behavior = "seek";
    let arenaBg = null;
    let lastTime = 0;
    let rafId = 0;
    let winnerNotified = false;
    let resizeObserver = null;

    window.RpsArena = {
        init(canvasId, dotnetReference) {
            canvas = document.getElementById(canvasId);
            if (!canvas) return false;
            ctx = canvas.getContext("2d");
            dotnetRef = dotnetReference;
            resizeCanvas();

            // re-rasterize the backing store when CSS size changes
            if (resizeObserver) resizeObserver.disconnect();
            resizeObserver = new ResizeObserver(resizeCanvas);
            resizeObserver.observe(canvas);
            return true;
        },

        start(config) {
            if (!canvas || !ctx) return;
            const counts = config.counts || { rock: 10, paper: 10, scissors: 10 };
            behavior = config.behavior || "seek";
            speed = config.speed || 1;
            arenaBg = config.arenaBg || null;

            entities = [];
            effects = [];
            for (const type of TYPES) {
                const n = Math.max(0, Math.floor(counts[type] || 0));
                for (let i = 0; i < n; i++) entities.push(spawn(type));
            }

            winnerNotified = false;
            running = true;
            lastTime = performance.now();
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(loop);
            notifyCounts();
        },

        setSpeed(s) { speed = Math.max(0, Math.min(10, s)); },
        setBehavior(b) { if (["seek", "random"].includes(b)) behavior = b; },
        pause() { running = false; },
        resume() {
            if (running || winnerNotified) return;
            running = true;
            lastTime = performance.now();
            rafId = requestAnimationFrame(loop);
        },

        stop() {
            running = false;
            cancelAnimationFrame(rafId);
            entities = [];
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        dispose() {
            this.stop();
            if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
            canvas = null;
            ctx = null;
            dotnetRef = null;
        }
    };

    function resizeCanvas() {
        if (!canvas) return;
        // hi-DPI: keep CSS px logical but render at device pixels for crispness
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(type) {
        const w = cssWidth(), h = cssHeight();
        const angle = Math.random() * Math.PI * 2;
        return {
            type,
            x: RADIUS + Math.random() * (w - RADIUS * 2),
            y: RADIUS + Math.random() * (h - RADIUS * 2),
            vx: Math.cos(angle),
            vy: Math.sin(angle)
        };
    }

    function cssWidth() { return canvas.getBoundingClientRect().width; }
    function cssHeight() { return canvas.getBoundingClientRect().height; }

    function loop(now) {
        if (!running) return;
        // clamp dt - rAF pauses on hidden tab, first frame back would be massive
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        step(dt);
        draw();
        if (!checkWinner()) rafId = requestAnimationFrame(loop);
    }

    function step(dt) {
        const w = cssWidth(), h = cssHeight();
        const dist = BASE_SPEED * speed * dt;

        for (const e of entities) {
            if (behavior === "random") {
                jitter(e, 4 * dt);
            } else {
                const target = nearest(e, BEATS[e.type]);                   // prey
                const threat = nearest(e, predatorTypeOf(e.type));          // predator
                let dx = 0, dy = 0;

                if (target) {
                    const [tx, ty] = unitVec(e, target);
                    dx += tx * SEEK_STRENGTH;
                    dy += ty * SEEK_STRENGTH;
                }
                if (threat) {
                    const [tx, ty] = unitVec(e, threat);
                    dx -= tx * FLEE_STRENGTH;
                    dy -= ty * FLEE_STRENGTH;
                }

                const len = Math.hypot(dx, dy) || 1;
                // ease toward target direction so motion stays smooth
                e.vx = e.vx * 0.85 + (dx / len) * 0.15;
                e.vy = e.vy * 0.85 + (dy / len) * 0.15;
            }

            const vlen = Math.hypot(e.vx, e.vy) || 1;
            e.vx /= vlen;
            e.vy /= vlen;

            e.x += e.vx * dist;
            e.y += e.vy * dist;

            if (e.x < RADIUS) { e.x = RADIUS; e.vx = Math.abs(e.vx); }
            else if (e.x > w - RADIUS) { e.x = w - RADIUS; e.vx = -Math.abs(e.vx); }
            if (e.y < RADIUS) { e.y = RADIUS; e.vy = Math.abs(e.vy); }
            else if (e.y > h - RADIUS) { e.y = h - RADIUS; e.vy = -Math.abs(e.vy); }
        }

        // O(n²) collision pass. Same-type = elastic bounce, cross-type = convert.
        let countsChanged = false;
        const r2 = (RADIUS * 2) * (RADIUS * 2);
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i], b = entities[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d2 = dx * dx + dy * dy;
                if (d2 >= r2) continue;

                const d = Math.sqrt(d2) || 0.0001;
                const nx = dx / d, ny = dy / d;
                const overlap = RADIUS * 2 - d;

                // separate along contact normal so they don't sit overlapping
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;

                if (a.type === b.type) {
                    // equal-mass elastic = swap velocity components along normal
                    const av = a.vx * nx + a.vy * ny;
                    const bv = b.vx * nx + b.vy * ny;
                    a.vx += (bv - av) * nx;
                    a.vy += (bv - av) * ny;
                    b.vx += (av - bv) * nx;
                    b.vy += (av - bv) * ny;
                } else if (BEATS[a.type] === b.type) {
                    spawnEffect(b.x, b.y);
                    b.type = a.type;
                    countsChanged = true;
                } else if (BEATS[b.type] === a.type) {
                    spawnEffect(a.x, a.y);
                    a.type = b.type;
                    countsChanged = true;
                }
            }
        }

        for (let i = effects.length - 1; i >= 0; i--) {
            effects[i].age += dt;
            if (effects[i].age >= EFFECT_DURATION) effects.splice(i, 1);
        }

        if (countsChanged) notifyCounts();
    }

    function spawnEffect(x, y) {
        effects.push({ x, y, age: 0 });
    }

    function notifyCounts() {
        if (!dotnetRef) return;
        let r = 0, p = 0, s = 0;
        for (const e of entities) {
            if (e.type === "rock") r++;
            else if (e.type === "paper") p++;
            else if (e.type === "scissors") s++;
        }
        dotnetRef.invokeMethodAsync("OnCountsChanged", r, p, s).catch(() => { });
    }

    // inverse of BEATS
    function predatorTypeOf(type) {
        for (const k of TYPES) if (BEATS[k] === type) return k;
        return null;
    }

    function nearest(e, type) {
        let best = null, bd = Infinity;
        for (const o of entities) {
            if (o === e || o.type !== type) continue;
            const dx = o.x - e.x, dy = o.y - e.y;
            const d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = o; }
        }
        return best;
    }

    function unitVec(from, to) {
        const dx = to.x - from.x, dy = to.y - from.y;
        const d = Math.hypot(dx, dy) || 1;
        return [dx / d, dy / d];
    }

    function jitter(e, amount) {
        e.vx += (Math.random() - 0.5) * amount;
        e.vy += (Math.random() - 0.5) * amount;
    }

    function draw() {
        const w = cssWidth(), h = cssHeight();
        ctx.clearRect(0, 0, w, h);

        if (arenaBg && arenaBg.startsWith("#")) {
            ctx.fillStyle = arenaBg;
            ctx.fillRect(0, 0, w, h);
        }

        // splash rings drawn behind glyphs so the new symbol stays in focus
        for (const fx of effects) {
            const t = fx.age / EFFECT_DURATION;
            const radius = RADIUS * (0.4 + t * 0.45);
            const alpha = (1 - t) * 0.2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${RADIUS * 1.8}px serif`;
        for (const e of entities) {
            ctx.fillText(GLYPHS[e.type] || "?", e.x, e.y);
        }
    }

    function checkWinner() {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        for (const e of entities) counts[e.type]++;
        const alive = TYPES.filter(t => counts[t] > 0);
        if (alive.length === 1 && !winnerNotified) {
            winnerNotified = true;
            running = false;
            if (dotnetRef) dotnetRef.invokeMethodAsync("OnWinner", alive[0]).catch(() => { });
            return true;
        }
        return false;
    }
})();
