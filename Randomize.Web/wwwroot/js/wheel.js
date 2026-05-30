// Spinning wheel canvas. Everything draws through drawWheel(); the backing
// store is scaled by devicePixelRatio to stay crisp on high-DPI screens.

// 16-colour palette, shared with the C# pages
const WHEEL_COLORS = [
    "#ef6f6c", "#f0915a", "#efc05a", "#d4d65f",
    "#9bd06b", "#63c98d", "#54c6b6", "#56b4d3",
    "#5b93d6", "#6f7fd6", "#8f74d4", "#aa6fd0",
    "#c66fc4", "#d96fa3", "#e06f86", "#cf7d6a"
];

// kept across redraws so the wheel doesn't jump back to 0
let wheelRotation = 0;
let wheelItems = [];
let wheelHighlight = null;

function getWheelCtx() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth || 320;
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, size };
}

// shrink the font as slices increase
function labelFontSize(total) {
    if (total <= 6) return 18;
    if (total <= 9) return 16;
    if (total <= 12) return 13;
    return 11;
}

// ellipsis if the label overflows its slice
function fitLabel(ctx, text, maxWidth) {
    text = text == null ? '' : String(text);
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
        t = t.slice(0, -1);
    }
    return t + '…';
}

// slice index under the top pointer (angle 3π/2) for a rotation
function indexAtPointer(rotation, total) {
    const seg = (2 * Math.PI) / total;
    let a = (1.5 * Math.PI - rotation) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return Math.floor(a / seg) % total;
}

function drawPointer(ctx, cx, pivotY, tick) {
    // `tick` rocks the flap as slices pass
    ctx.save();
    ctx.translate(cx, pivotY);
    ctx.rotate(tick);
    ctx.beginPath();
    ctx.moveTo(0, 16);       // tip - dips into the wheel
    ctx.lineTo(-10, -9);
    ctx.lineTo(10, -9);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#f5f5f7';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();
    ctx.restore();
}

function drawWheel(items, rotation, highlight, tick) {
    const c = getWheelCtx();
    if (!c) return;
    const { ctx, size } = c;
    const center = size / 2;
    const radius = center - 18;          // room for pointer + glow
    const total = items.length;

    ctx.clearRect(0, 0, size, size);
    if (total === 0) return;
    const seg = (2 * Math.PI) / total;

    // shadow disc behind the wheel
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // rotating body
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    for (let i = 0; i < total; i++) {
        const a0 = i * seg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a0 + seg);
        ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.stroke();
    }

    // glow on the winning slice
    if (highlight != null && highlight >= 0 && highlight < total) {
        const a0 = highlight * seg;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a0 + seg);
        ctx.closePath();
        ctx.shadowColor = 'rgba(255,255,255,0.95)';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
    }

    // labels
    ctx.font = `600 ${labelFontSize(total)}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < total; i++) {
        ctx.save();
        ctx.rotate(i * seg + seg / 2);
        const label = fitLabel(ctx, items[i], radius - 34);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(label, radius - 14, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, radius - 14, 0);
        ctx.restore();
    }
    ctx.restore();

    // centre hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, Math.max(13, radius * 0.12), 0, 2 * Math.PI);
    ctx.fillStyle = '#f5f5f7';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
    ctx.restore();

    drawPointer(ctx, center, center - radius - 1, tick || 0);
}

window.renderWheel = function (items) {
    wheelItems = (items || []).slice();
    wheelHighlight = null;
    drawWheel(wheelItems, wheelRotation, null, 0);
};

// spins and resolves with the winning slice index
window.spinWheel = function (items) {
    wheelItems = (items || []).slice();
    wheelHighlight = null;
    const total = wheelItems.length;
    if (total < 2) return Promise.resolve(-1);

    const startRotation = wheelRotation;
    const turns = 4 + Math.floor(Math.random() * 4);          // 4–7 full turns
    const finalRotation = startRotation + turns * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 3000 + Math.random() * 900;
    const startTime = performance.now();
    let lastIdx = indexAtPointer(startRotation, total);
    let tick = 0;

    return new Promise(resolve => {
        function frame(now) {
            let p = (now - startTime) / duration;
            if (p > 1) p = 1;
            const eased = 1 - Math.pow(1 - p, 5);             // easeOutQuint
            const rotation = startRotation + (finalRotation - startRotation) * eased;
            wheelRotation = rotation;

            // kick the pointer as each slice passes
            const idx = indexAtPointer(rotation, total);
            if (idx !== lastIdx) { tick = 0.42; lastIdx = idx; }
            tick *= 0.82;

            drawWheel(wheelItems, rotation, null, tick);

            if (p < 1) {
                requestAnimationFrame(frame);
            } else {
                wheelRotation = finalRotation % (2 * Math.PI);
                const winner = indexAtPointer(wheelRotation, total);
                wheelHighlight = winner;
                drawWheel(wheelItems, wheelRotation, winner, 0);
                resolve(winner);
            }
        }
        requestAnimationFrame(frame);
    });
};

// confetti burst over the wheel
window.celebrate = function () {
    const c = getWheelCtx();
    if (!c) return Promise.resolve();
    const center = c.size / 2;

    const pieces = [];
    for (let i = 0; i < 38; i++) {
        pieces.push({
            x: center + (Math.random() - 0.5) * 70,
            y: center,
            vx: (Math.random() - 0.5) * 7,
            vy: -6 - Math.random() * 7,
            w: 5 + Math.random() * 6,
            color: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 0.4
        });
    }

    const duration = 1300;
    const gravity = 0.32;
    const startTime = performance.now();

    return new Promise(resolve => {
        function frame(now) {
            const elapsed = now - startTime;
            drawWheel(wheelItems, wheelRotation, wheelHighlight, 0);

            const ctx = getWheelCtx();
            if (!ctx) { resolve(); return; }
            const fade = Math.max(0, 1 - elapsed / duration);
            for (const pc of pieces) {
                pc.vy += gravity;
                pc.x += pc.vx;
                pc.y += pc.vy;
                pc.rot += pc.vrot;
                ctx.ctx.save();
                ctx.ctx.globalAlpha = fade;
                ctx.ctx.translate(pc.x, pc.y);
                ctx.ctx.rotate(pc.rot);
                ctx.ctx.fillStyle = pc.color;
                ctx.ctx.fillRect(-pc.w / 2, -pc.w / 2, pc.w, pc.w * 0.6);
                ctx.ctx.restore();
            }

            if (elapsed < duration) {
                requestAnimationFrame(frame);
            } else {
                drawWheel(wheelItems, wheelRotation, wheelHighlight, 0);
                resolve();
            }
        }
        requestAnimationFrame(frame);
    });
};

// redraw on resize to stay sharp
let wheelResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(wheelResizeTimer);
    wheelResizeTimer = setTimeout(() => {
        if (wheelItems.length > 0) {
            drawWheel(wheelItems, wheelRotation, wheelHighlight, 0);
        }
    }, 150);
});
