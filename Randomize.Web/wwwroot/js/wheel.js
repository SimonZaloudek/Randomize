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
let wheelBusy = false;          // true while the spin animation runs

// slice images stay JS-side keyed by slice id; C# only hears "slice X has image Y"
const sliceImages = new Map();  // id -> { src, w, h, name, zoom, offX, offY }
let imagesEnabled = false;
let imagesDotNet = null;        // DotNetObjectReference of the Wheel page
let dropHoverIdx = -1;          // slice highlighted while a file is dragged over

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

// turn weights into cumulative wedge boundaries; equal weights => even slices
function buildSegments(items) {
    const w = items.map(it => (it && it.weight > 0 ? it.weight : 1));
    const total = w.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    return w.map(weight => {
        const seg = { startFrac: acc / total, frac: weight / total };
        acc += weight;
        return seg;
    });
}

// slice index under the top pointer (angle 3π/2) for a rotation
function indexAtPointer(rotation, items) {
    const segs = buildSegments(items);
    let a = (1.5 * Math.PI - rotation) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    const f = a / (2 * Math.PI);
    for (let i = segs.length - 1; i >= 0; i--) {
        if (f >= segs[i].startFrac) return i;
    }
    return 0;
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

// draw one slice's image: clipped to the wedge, cover-fitted to its bounding
// box in the bisector frame, then adjusted by the user's zoom/pan
function drawSliceImage(ctx, st, a0, a1, radius) {
    const half = (a1 - a0) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, a0, a1);
    ctx.closePath();
    ctx.clip();
    ctx.rotate(a0 + half);
    // wedge bbox in this frame: x 0..radius, y ±halfW
    const halfW = radius * Math.min(1, Math.sin(Math.min(half, Math.PI / 2)));
    const s = Math.max(radius / st.w, (2 * halfW) / st.h) * st.zoom;
    ctx.drawImage(st.src,
        radius / 2 + st.offX - (st.w * s) / 2,
        st.offY - (st.h * s) / 2,
        st.w * s, st.h * s);
    // subtle scrim so the white label stays readable on busy photos
    ctx.fillStyle = 'rgba(15, 12, 24, 0.30)';
    ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);
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
    const segs = buildSegments(items);
    const TAU = 2 * Math.PI;

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
        const a0 = segs[i].startFrac * TAU;
        const a1 = a0 + segs[i].frac * TAU;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a1);
        ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fill();

        // image sits between the fill and the border stroke
        const st = imagesEnabled && items[i] ? sliceImages.get(items[i].id) : null;
        if (st) {
            drawSliceImage(ctx, st, a0, a1, radius);
            ctx.beginPath();                      // re-path: the image pass built its own
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, a0, a1);
            ctx.closePath();
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.stroke();
    }

    // accent ring on the slice a dragged file is hovering over
    if (dropHoverIdx >= 0 && dropHoverIdx < total) {
        const a0 = segs[dropHoverIdx].startFrac * TAU;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a0 + segs[dropHoverIdx].frac * TAU);
        ctx.closePath();
        ctx.shadowColor = 'rgba(138,107,255,0.9)';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#8a6bff';
        ctx.stroke();
        ctx.restore();
    }

    // glow on the winning slice
    if (highlight != null && highlight >= 0 && highlight < total) {
        const a0 = segs[highlight].startFrac * TAU;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a0 + segs[highlight].frac * TAU);
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
        ctx.rotate((segs[i].startFrac + segs[i].frac / 2) * TAU);
        const label = fitLabel(ctx, items[i] && items[i].label, radius - 34);
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

// drop stored images whose slice no longer exists (eliminated / resized away)
function pruneImages() {
    if (sliceImages.size === 0) return;
    const ids = new Set(wheelItems.map(it => it && it.id));
    for (const id of [...sliceImages.keys()]) {
        if (!ids.has(id)) sliceImages.delete(id);
    }
}

window.renderWheel = function (items) {
    wheelItems = (items || []).slice();
    wheelHighlight = null;
    pruneImages();
    drawWheel(wheelItems, wheelRotation, null, 0);
};

// spins and resolves with the winning slice index; an optional targetIndex
// makes the wheel land inside that slice (same turns/easing, looks natural)
window.spinWheel = function (items, targetIndex) {
    wheelItems = (items || []).slice();
    wheelHighlight = null;
    pruneImages();
    const total = wheelItems.length;
    if (total < 2) return Promise.resolve(-1);
    wheelBusy = true;

    const startRotation = wheelRotation;
    const turns = 4 + Math.floor(Math.random() * 4);          // 4–7 full turns
    const TAU2 = 2 * Math.PI;
    let landing = Math.random() * TAU2;
    if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < total) {
        // land at a random point inside the target slice, away from its edges
        const seg = buildSegments(wheelItems)[targetIndex];
        const ft = seg.startFrac + seg.frac * (0.1 + Math.random() * 0.8);
        landing = (1.5 * Math.PI - ft * TAU2 - startRotation) % TAU2;
        if (landing < 0) landing += TAU2;
    }
    const finalRotation = startRotation + turns * TAU2 + landing;
    const duration = 3000 + Math.random() * 900;
    const startTime = performance.now();
    let lastIdx = indexAtPointer(startRotation, wheelItems);
    let tick = 0;

    return new Promise(resolve => {
        function frame(now) {
            let p = (now - startTime) / duration;
            if (p > 1) p = 1;
            const eased = 1 - Math.pow(1 - p, 5);             // easeOutQuint
            const rotation = startRotation + (finalRotation - startRotation) * eased;
            wheelRotation = rotation;

            // kick the pointer as each slice passes
            const idx = indexAtPointer(rotation, wheelItems);
            if (idx !== lastIdx) { tick = 0.42; lastIdx = idx; }
            tick *= 0.82;

            drawWheel(wheelItems, rotation, null, tick);

            if (p < 1) {
                requestAnimationFrame(frame);
            } else {
                wheelRotation = finalRotation % (2 * Math.PI);
                const winner = indexAtPointer(wheelRotation, wheelItems);
                wheelHighlight = winner;
                wheelBusy = false;
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

// === SLICE IMAGES ===
// While image mode is on the canvas belongs to image editing:
// click a slice = pick a file, drag = pan its image, scroll = zoom,
// drag & drop a file onto a slice = assign. Spinning goes via the button.

function redrawWheel() {
    drawWheel(wheelItems, wheelRotation, wheelHighlight, 0);
}

// slice index under a client point, accounting for the current rotation
function sliceIndexAtClient(clientX, clientY) {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas || wheelItems.length === 0) return -1;
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - rect.left - rect.width / 2;
    const dy = clientY - rect.top - rect.height / 2;
    if (Math.hypot(dx, dy) > rect.width / 2 - 18) return -1;
    let a = (Math.atan2(dy, dx) - wheelRotation) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    const f = a / (2 * Math.PI);
    const segs = buildSegments(wheelItems);
    for (let i = segs.length - 1; i >= 0; i--) {
        if (f >= segs[i].startFrac) return i;
    }
    return 0;
}

// bisector angle of a slice in wheel space (rotation not included)
function sliceMidAngle(idx) {
    const segs = buildSegments(wheelItems);
    return (segs[idx].startFrac + segs[idx].frac / 2) * 2 * Math.PI;
}

// decode + downscale (≤512px) so spin redraws stay cheap even with 16 photos
async function decodeSliceImage(file) {
    const MAX = 512;
    let bmp;
    if ('createImageBitmap' in window) {
        bmp = await createImageBitmap(file);
    } else {
        bmp = await new Promise((res, rej) => {
            const url = URL.createObjectURL(file);
            const im = new Image();
            im.onload = () => { URL.revokeObjectURL(url); res(im); };
            im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode failed')); };
            im.src = url;
        });
    }
    const w = bmp.width, h = bmp.height;
    const scale = Math.min(1, MAX / Math.max(w, h));
    if (scale === 1) return { src: bmp, w, h };
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    if (bmp.close) bmp.close();
    return { src: cv, w: cv.width, h: cv.height };
}

function notifyImageChange(id, name) {
    if (imagesDotNet) imagesDotNet.invokeMethodAsync('OnSliceImageChanged', id, name);
}

async function assignSliceImage(id, file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    try {
        const img = await decodeSliceImage(file);
        sliceImages.set(id, { ...img, name: file.name, zoom: 1, offX: 0, offY: 0 });
        redrawWheel();
        notifyImageChange(id, file.name);
    } catch { /* undecodable file - ignore */ }
}

// hidden picker shared by all slices; pickTargetId says who asked
let imageFileInput = null;
let pickTargetId = null;

function ensureImageInput() {
    if (imageFileInput) return imageFileInput;
    imageFileInput = document.createElement('input');
    imageFileInput.type = 'file';
    imageFileInput.accept = 'image/*';
    imageFileInput.style.display = 'none';
    imageFileInput.addEventListener('change', () => {
        const file = imageFileInput.files && imageFileInput.files[0];
        if (file && pickTargetId != null) assignSliceImage(pickTargetId, file);
        imageFileInput.value = '';        // same file selectable again later
    });
    document.body.appendChild(imageFileInput);
    return imageFileInput;
}

// pan state: dragging on a slice that has an image moves it around
let panId = null;
let panStart = null;   // { x, y, offX, offY, ang }
let panMoved = false;

function wireImageEvents() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas || canvas.dataset.imgWired) return;
    canvas.dataset.imgWired = '1';

    canvas.addEventListener('click', e => {
        if (!imagesEnabled || wheelBusy) return;
        if (panMoved) { panMoved = false; return; }   // that was a pan, not a click
        const idx = sliceIndexAtClient(e.clientX, e.clientY);
        if (idx < 0) return;
        pickTargetId = wheelItems[idx].id;
        ensureImageInput().click();
    });

    canvas.addEventListener('pointerdown', e => {
        if (!imagesEnabled || wheelBusy) return;
        panMoved = false;
        const idx = sliceIndexAtClient(e.clientX, e.clientY);
        if (idx < 0) return;
        const st = sliceImages.get(wheelItems[idx].id);
        if (!st) return;
        panId = wheelItems[idx].id;
        panStart = { x: e.clientX, y: e.clientY, offX: st.offX, offY: st.offY,
                     ang: wheelRotation + sliceMidAngle(idx) };
        canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
        if (panId == null || !panStart) return;
        const st = sliceImages.get(panId);
        if (!st) return;
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) panMoved = true;
        // rotate the screen delta into the slice's bisector frame
        const cos = Math.cos(panStart.ang), sin = Math.sin(panStart.ang);
        const size = canvas.clientWidth || 320;
        const lim = size / 2;                          // loose clamp, keeps it findable
        st.offX = Math.max(-lim, Math.min(lim, panStart.offX + dx * cos + dy * sin));
        st.offY = Math.max(-lim, Math.min(lim, panStart.offY - dx * sin + dy * cos));
        redrawWheel();
    });

    const endPan = () => { panId = null; panStart = null; };
    canvas.addEventListener('pointerup', endPan);
    canvas.addEventListener('pointercancel', endPan);

    // scroll over a slice with an image zooms it (0.5x–4x of autofit)
    canvas.addEventListener('wheel', e => {
        if (!imagesEnabled || wheelBusy) return;
        const idx = sliceIndexAtClient(e.clientX, e.clientY);
        if (idx < 0) return;
        const st = sliceImages.get(wheelItems[idx].id);
        if (!st) return;
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        st.zoom = Math.max(0.5, Math.min(4, st.zoom * factor));
        redrawWheel();
    }, { passive: false });

    canvas.addEventListener('dragover', e => {
        if (!imagesEnabled || wheelBusy) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const idx = sliceIndexAtClient(e.clientX, e.clientY);
        if (idx !== dropHoverIdx) { dropHoverIdx = idx; redrawWheel(); }
    });

    canvas.addEventListener('dragleave', () => {
        if (dropHoverIdx === -1) return;
        dropHoverIdx = -1;
        redrawWheel();
    });

    canvas.addEventListener('drop', e => {
        if (!imagesEnabled || wheelBusy) return;
        e.preventDefault();
        const idx = sliceIndexAtClient(e.clientX, e.clientY);
        dropHoverIdx = -1;
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (idx >= 0 && file) {
            assignSliceImage(wheelItems[idx].id, file);
        } else {
            redrawWheel();
        }
    });
}

window.wheelImages = {
    // toggled by the page checkbox; dotNetRef receives OnSliceImageChanged
    setEnabled(on, dotNetRef) {
        imagesEnabled = !!on;
        if (dotNetRef) imagesDotNet = dotNetRef;
        wireImageEvents();
        redrawWheel();
    },
    clear(id) {
        sliceImages.delete(id);
        redrawWheel();
    },
    // fresh page instance: slice ids restart, old state must not bleed in
    reset() {
        sliceImages.clear();
        imagesEnabled = false;
        imagesDotNet = null;
        dropHoverIdx = -1;
    }
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
