// circuitry_background.js — HSL-powered, CSS-variable driven

window.addEventListener('load', () => {
    const canvas = document.getElementById('circuitCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helpers for CSS variables and HSL parsing
    const rootStyles = getComputedStyle(document.documentElement);

    const getVar = (name, fallback) => {
        const v = rootStyles.getPropertyValue(name);
        return v && v.trim() ? v.trim() : fallback;
    };

    // Accepts "hsl(...)" or "hsla(...)" (comma or space separated, we normalize)
    const parseHsl = (hslString, fallbackH, fallbackS, fallbackL) => {
        if (!hslString || !hslString.trim) {
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }

        let str = hslString.trim();

        // Ensure we have something like "hsl(...)" or "hsla(...)"
        if (!/^hsl[a]?\(/i.test(str)) {
            // Not an HSL string, return fallback
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }

        // Remove "hsl(" / "hsla(" and ")"
        str = str.replace(/hsla?\(/i, '').replace(')', '').trim();

        // Normalize spaces -> commas so we can split reliably
        // e.g. "225 44% 40%" -> "225,44%,40%"
        if (str.indexOf(',') === -1) {
            str = str.replace(/\s+/g, ',');
        }

        const parts = str.split(',').map(p => p.trim()).filter(Boolean);

        // Expect H, S, L [ , A ] – but we only care about HSL here
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        const l = parseFloat(parts[2]);

        if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) {
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }

        return { h, s, l };
    };

    // Small helper to build HSLA strings and optionally tweak lightness
    const hslToString = (hsl, alpha = 1, lightnessOffset = 0) => {
        const h = hsl.h;
        const s = hsl.s;
        let l = hsl.l + lightnessOffset;
        if (l < 0) l = 0;
        if (l > 100) l = 100;
        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    };

    // Read colors from CSS
    const circuitColors = {
        base: getVar('--circuit-color-base', 'hsla(239, 52%, 43%, 0.15)'),
        pulse: getVar('--circuit-color-pulse', 'hsla(256, 52%, 43%, 1.00)'),
        grid: getVar('--circuit-color-grid', 'hsla(245, 52%, 43%, 0.02)'),
        cpuGlow: getVar('--circuit-color-cpu-glow', 'hsla(252, 52%, 43%, 0.20)'),

        trailHsl: parseHsl(
            getVar('--circuit-color-trail', 'hsla(254, 52%, 43%, 1.00)'),
            135, 52, 43
        ),
        ledHsl: parseHsl(
            getVar('--circuit-color-led', 'hsla(251, 52%, 43%, 1.00)'),
            135, 52, 43
        ),

        baseHsl: parseHsl(
            getVar('--circuit-color-base', 'hsla(239, 52%, 43%, 0.15)'),
            239, 52, 43
        ),
        pulseHsl: parseHsl(
            getVar('--circuit-color-pulse', 'hsla(256, 52%, 43%, 1.00)'),
            256, 52, 43
        )
    };

    let width, height;
    let lines = [];
    let components = [];

    const config = {
        gridSize: 30,
        lineCount: 0,
        colorBase: circuitColors.base,        // trace lines
        colorPulse: circuitColors.pulse,      // bright moving signal
        trailHsl: circuitColors.trailHsl,     // trail, alpha added in JS
        trailLength: 10,
        pulseSpeed: 2,
        maxPathLength: 20,
        colorGrid: circuitColors.grid,        // faint grid
        ledHsl: circuitColors.ledHsl,         // LEDs, alpha added in JS
        cpuGlow: circuitColors.cpuGlow,       // CPU glow
        baseHsl: circuitColors.baseHsl,
        pulseHsl: circuitColors.pulseHsl
    };

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    class Component {
        constructor() {
            this.x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
            this.y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;
            this.type = randomInt(0, 2);
            this.blinkOffset = Math.random() * Math.PI * 2;
            this.size = randomInt(0, 1) === 0 ? config.gridSize : config.gridSize * 2;

            // Avoid placing components on top of the CPU
            const cx = width / 2;
            const cy = height / 2;
            const safeZone = 150;
            if (Math.abs(this.x - cx) < safeZone && Math.abs(this.y - cy) < safeZone) {
                this.x = -100;
            }
        }

        draw(time) {
            if (this.x < 0) return;

            ctx.strokeStyle = config.colorBase;
            ctx.lineWidth = 1.5;

            if (this.type === 0) {
                // Capacitor (stylized, same palette)
                const w = config.gridSize * 0.6;
                const h = config.gridSize * 1.2;

                // Lead
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - h / 2 - 5);
                ctx.lineTo(this.x, this.y + h / 2 + 5);
                ctx.stroke();

                // Body
                ctx.fillStyle = hslToString(config.baseHsl, 0.35, 15); // lighter than traces
                ctx.fillRect(this.x - w / 2, this.y - h / 2, w, h);
                ctx.strokeRect(this.x - w / 2, this.y - h / 2, w, h);

                // Stripe
                ctx.beginPath();
                ctx.moveTo(this.x - w / 2, this.y - h / 4);
                ctx.lineTo(this.x + w / 2, this.y - h / 4);
                ctx.stroke();
            }
            else if (this.type === 1) {
                // Mini Chip, using base/pulse colors
                const s = config.gridSize * 0.8;

                // Chip body
                ctx.fillStyle = hslToString(config.baseHsl, 0.4, 18);
                ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
                ctx.strokeRect(this.x - s / 2, this.y - s / 2, s, s);

                // Pins
                ctx.fillStyle = config.colorPulse;
                for (let i = -1; i <= 1; i += 2) {
                    ctx.fillRect(this.x - s / 2 - 2, this.y + i * 4 - 1, 2, 2);
                    ctx.fillRect(this.x + s / 2, this.y + i * 4 - 1, 2, 2);
                    ctx.fillRect(this.x + i * 4 - 1, this.y - s / 2 - 2, 2, 2);
                    ctx.fillRect(this.x + i * 4 - 1, this.y + s / 2, 2, 2);
                }

                // Orientation dot
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (this.type === 2) {
                // LED
                const alpha = (Math.sin(time * 0.005 + this.blinkOffset) + 1) / 2 * 0.5 + 0.2;
                const { h, s, l } = config.ledHsl;
                ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    class CircuitLine {
        constructor() {
            this.trailHistory = [];
            this.reset();
        }

        reset() {
            this.x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
            this.y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;

            this.path = [{ x: this.x, y: this.y }];

            this.dir = randomInt(0, 1) === 0 ? 'x' : 'y';
            this.length = randomInt(5, config.maxPathLength);
            this.generatePath();

            this.pulseProgress = 0;
            this.pulseSpeed = (Math.random() * 1 + 0.5) * config.pulseSpeed;
            this.hasPulse = Math.random() > 0.3;
            this.pulseDelay = randomInt(0, 100);
            this.trailHistory = [];
        }

        generatePath() {
            let currentX = this.x;
            let currentY = this.y;
            let currentDir = this.dir;

            for (let i = 0; i < this.length; i++) {
                const segmentLen = randomInt(2, 6) * config.gridSize;

                if (currentDir === 'x') {
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    currentX += segmentLen * direction;
                    currentDir = 'y';
                } else {
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    currentY += segmentLen * direction;
                    currentDir = 'x';
                }

                if (currentX < 0) currentX = 0;
                if (currentX > width) currentX = width;
                if (currentY < 0) currentY = 0;
                if (currentY > height) currentY = height;

                this.path.push({ x: currentX, y: currentY });
            }
        }

        draw() {
            ctx.beginPath();
            ctx.strokeStyle = config.colorBase;
            ctx.lineWidth = 1;
            ctx.moveTo(this.path[0].x, this.path[0].y);

            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();

            // Node at start
            ctx.fillStyle = config.colorBase;
            ctx.beginPath();
            ctx.arc(this.path[0].x, this.path[0].y, 2, 0, Math.PI * 2);
            ctx.fill();

            if (this.hasPulse) {
                this.updatePulse();
            }
        }

        updatePulse() {
            if (this.pulseDelay > 0) {
                this.pulseDelay--;
                return;
            }

            this.pulseProgress += this.pulseSpeed;

            let distanceTravelled = 0;
            let targetDistance = this.pulseProgress;
            let pos = { x: this.path[0].x, y: this.path[0].y };
            let segmentFound = false;

            for (let i = 0; i < this.path.length - 1; i++) {
                let p1 = this.path[i];
                let p2 = this.path[i + 1];
                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (distanceTravelled + dist >= targetDistance) {
                    let remaining = targetDistance - distanceTravelled;
                    let ratio = remaining / dist;
                    pos.x = p1.x + dx * ratio;
                    pos.y = p1.y + dy * ratio;
                    segmentFound = true;
                    break;
                }
                distanceTravelled += dist;
            }

            if (!segmentFound) {
                this.pulseProgress = 0;
                this.pulseDelay = randomInt(20, 100);
                if (Math.random() > 0.8) this.reset();
            } else {
                this.trailHistory.push({ x: pos.x, y: pos.y });
                if (this.trailHistory.length > config.trailLength) {
                    this.trailHistory.shift();
                }

                // Trail dots with fading alpha (HSLA)
                const { h, s, l } = config.trailHsl;
                for (let i = 0; i < this.trailHistory.length; i++) {
                    const trailPos = this.trailHistory[i];
                    const alpha = (i + 1) / this.trailHistory.length;
                    const a = (0.6 * alpha).toFixed(2);
                    ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
                    ctx.beginPath();
                    ctx.arc(trailPos.x, trailPos.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Head pulse
                ctx.shadowBlur = 10;
                ctx.shadowColor = config.colorPulse;
                ctx.fillStyle = config.colorPulse;

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    function drawCPU() {
        const cx = width / 2;
        const cy = height / 2;
        const size = 220;
        const halfSize = size / 2;

        // Outer glow from theme
        ctx.shadowBlur = 20;
        ctx.shadowColor = config.cpuGlow;

        // Main package
        ctx.fillStyle = hslToString(config.baseHsl, 0.25, 20);
        ctx.fillRect(cx - halfSize, cy - halfSize, size, size);

        ctx.strokeStyle = config.colorPulse;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - halfSize, cy - halfSize, size, size);
        ctx.shadowBlur = 0;

        // Pins around the package
        ctx.fillStyle = config.colorPulse;
        const pinCount = 16;
        const pinW = 6;
        const pinH = 4;
        const spacing = size / (pinCount + 1);

        for (let i = 1; i <= pinCount; i++) {
            ctx.fillRect(cx - halfSize + i * spacing - pinW / 2, cy - halfSize - pinH, pinW, pinH);
            ctx.fillRect(cx - halfSize + i * spacing - pinW / 2, cy + halfSize, pinW, pinH);
            ctx.fillRect(cx - halfSize - pinH, cy - halfSize + i * spacing - pinW / 2, pinH, pinW);
            ctx.fillRect(cx + halfSize, cy - halfSize + i * spacing - pinW / 2, pinH, pinW);
        }

        // Inner die
        const innerSize = 140;
        const innerHalf = innerSize / 2;
        ctx.fillStyle = hslToString(config.baseHsl, 0.3, 26);
        ctx.fillRect(cx - innerHalf, cy - innerHalf, innerSize, innerSize);

        ctx.strokeStyle = config.colorPulse;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - innerHalf, cy - innerHalf, innerSize, innerSize);

        // Inner "logic grid"
        const gridSize = 8;
        const padding = 10;
        const cols = Math.floor((innerSize - padding * 2) / gridSize);
        const rows = Math.floor((innerSize - padding * 2) / gridSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (Math.random() > 0.4) {
                    const alpha = Math.random() * 0.3 + 0.1;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = hslToString(config.pulseHsl, 1, 5);
                    ctx.fillRect(
                        cx - innerHalf + padding + i * gridSize + 1,
                        cy - innerHalf + padding + j * gridSize + 1,
                        gridSize - 2,
                        gridSize - 2
                    );
                }
            }
        }
        ctx.globalAlpha = 1.0;

        // Corner notch
        ctx.fillStyle = config.colorPulse;
        ctx.beginPath();
        ctx.moveTo(cx - halfSize, cy - halfSize);
        ctx.lineTo(cx - halfSize + 20, cy - halfSize);
        ctx.lineTo(cx - halfSize, cy - halfSize + 20);
        ctx.fill();
    }

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        lines = [];
        components = [];

        // Add static components
        const componentCount = (width * height) / 45000;
        for (let i = 0; i < componentCount; i++) {
            components.push(new Component());
        }

        // Add circuit lines
        const area = width * height;
        const density = area / 30000;

        for (let i = 0; i < density; i++) {
            lines.push(new CircuitLine());
        }
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);

        // Background grid
        ctx.fillStyle = config.colorGrid;
        for (let x = 0; x < width; x += config.gridSize * 4) {
            ctx.fillRect(x, 0, 1, height);
        }
        for (let y = 0; y < height; y += config.gridSize * 4) {
            ctx.fillRect(0, y, width, 1);
        }

        // Static decorative components
        components.forEach(comp => comp.draw(time));

        // Circuit lines
        lines.forEach(line => line.draw());

        // CPU in center
        drawCPU();

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);

    init();
    animate(0);
});
