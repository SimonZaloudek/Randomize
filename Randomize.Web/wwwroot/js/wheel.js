function drawPointer(ctx, cx, cy, radius) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#d32f2f";
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 6);      //top
    ctx.lineTo(cx - 5, cy - radius - 5);  //left
    ctx.lineTo(cx + 5, cy - radius - 5);  //right
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

const colors = [
    "#FF0000", // 1 - Red
    "#0099FF", // 2 - Black
    "#FFFF00", // 3 - Yellow
    "#00FF00", // 4 - Lime
    "#00FFFF", // 5 - Cyan
    "#0000FF", // 6 - Blue
    "#8B00FF", // 7 - Violet
    "#FF1493", // 8 - Pink
    "#FF7F00", // 9 - Orange
    "#FFD700", // 10 - Gold
    "#ADFF2F", // 11 - GreenYellow
    "#40E0D0", // 12 - Turquoise
    "#1E90FF", // 13 - DodgerBlue
    "#7B68EE", // 14 - MediumSlateBlue
    "#C71585", // 15 - MediumVioletRed
    "#708090"  // 16 - SlateGray
];

window.renderWheel = function (items) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = center - 5;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = items.length;
    const angle = (2 * Math.PI) / total;

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2a2a2a";

    for (let i = 0; i < total; i++) {
        const start = i * angle;
        const end = start + angle;
        const hue = (i * 360) / total;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.stroke();
    }

    for (let i = 0; i < total; i++) {
        const start = i * angle;
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + angle / 2);
        ctx.textAlign = "right";
        ctx.font = "19px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#f0f0f0";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.strokeText(items[i], radius - 12, 5);
        ctx.fillText(items[i], radius - 12, 5);
        ctx.restore();
    }

    drawPointer(ctx, center, center, radius);
};

window.spinWheel = async function (items) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = center - 5;

    const total = items.length;
    const anglePerItem = (2 * Math.PI) / total;
    const randomFinalAngle = Math.random() * (2 * Math.PI);
    const spins = 6;
    const finalAngle = (2 * Math.PI * spins) + randomFinalAngle;
    const start = performance.now();
    const duration = 3000;

    return await new Promise(resolve => {
        function animate(time) {
            let progress = (time - start) / duration;
            if (progress > 1) progress = 1;

            const ease = 1 - Math.pow(1 - progress, 3);
            const angleOffset = finalAngle * ease;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Shadow
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 6;
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, 2 * Math.PI);
            ctx.fillStyle = "#000";
            ctx.fill();
            ctx.restore();

            // Wheel
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angleOffset);
            ctx.translate(-center, -center);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#2a2a2a";

            for (let i = 0; i < total; i++) {
                const start = i * anglePerItem;
                const end = start + anglePerItem;
                const hue = (i * 360) / total;

                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.arc(center, center, radius, start, end);
                ctx.closePath();
                ctx.fillStyle = colors[i % colors.length];
                ctx.fill();
                ctx.stroke();

                ctx.save();
                ctx.translate(center, center);
                ctx.rotate(start + anglePerItem / 2);
                ctx.textAlign = "right";
                ctx.font = "20px 'Segoe UI', sans-serif";
                ctx.fillStyle = "#f0f0f0";
                ctx.lineWidth = 1;
                ctx.strokeStyle = "black";
                ctx.strokeText(items[i], radius - 12, 5);
                ctx.fillText(items[i], radius - 12, 5);
                ctx.restore();
            }

            ctx.restore();

            // Pointer
            drawPointer(ctx, center, center, radius);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                let relativeAngle = (-finalAngle + Math.PI * 1.5) % (2 * Math.PI);
                if (relativeAngle < 0) relativeAngle += 2 * Math.PI;
                const selectedIndex = Math.floor(relativeAngle / anglePerItem) % total;
                resolve(items[selectedIndex]);
            }
        }

        requestAnimationFrame(animate);
    });
};