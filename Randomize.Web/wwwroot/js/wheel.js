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

window.renderWheel = function (items) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = center - 5;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = items.length;
    const angle = (2 * Math.PI) / total;

    ctx.lineWidth = 1;

    for (let i = 0; i < total; i++) {
        const start = i * angle;
        const end = start + angle + 0.0001;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = `hsl(${(i * 360) / total}, 70%, 70%)`;
        ctx.fill();
        ctx.stroke();

        //label
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + angle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "black";
        ctx.font = "14px sans-serif";
        ctx.fillText(items[i], radius - 10, 0);
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
    //random angle
    const randomFinalAngle = Math.random() * (2 * Math.PI); 
    const spins = 6;
    const finalAngle = (2 * Math.PI * spins) + randomFinalAngle;
    const start = performance.now();
    const duration = 3000;

    ctx.lineWidth = 1;

    return await new Promise(resolve => {
        function animate(time) {
            let progress = (time - start) / duration;
            if (progress > 1) progress = 1;

            let ease = 1 - Math.pow(1 - progress, 3);
            let angleOffset = finalAngle * ease;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(center, center);
            ctx.rotate(angleOffset);
            ctx.translate(-center, -center);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < total; i++) {
                const start = i * anglePerItem;
                const end = start + anglePerItem + 0.0001;

                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.arc(center, center, radius, start, end);
                ctx.closePath();
                ctx.fillStyle = `hsl(${(i * 360) / total}, 70%, 70%)`;
                ctx.fill();
                ctx.stroke();

                ctx.save();
                ctx.translate(center, center);
                ctx.rotate(start + anglePerItem / 2);
                ctx.textAlign = "right";
                ctx.fillStyle = "black";
                ctx.font = "14px sans-serif";
                ctx.fillText(items[i], radius - 10, 0);
                ctx.restore();
            }

            //pointer
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            drawPointer(ctx, center, center, radius);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                //result
                let relativeAngle = (-finalAngle + Math.PI * 1.5) % (2 * Math.PI);
                if (relativeAngle < 0) {
                    relativeAngle += 2 * Math.PI;
                }
                const selectedIndex = Math.floor(relativeAngle / anglePerItem) % total;
                resolve(items[selectedIndex]);
            }
        }

        requestAnimationFrame(animate);
    });
};