// circuitry_background_script.js — Optimized with pre-rendering & multiple processors

window.addEventListener('load', () => {
    const canvas = document.getElementById('circuitCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === Pre-rendered canvas for static elements ===
    let staticCanvas, staticCtx;

    // === CSS Variable Helpers ===
    const rootStyles = getComputedStyle(document.documentElement);

    const getVar = (name, fallback) => {
        const v = rootStyles.getPropertyValue(name);
        return v && v.trim() ? v.trim() : fallback;
    };

    const parseHsl = (hslString, fallbackH, fallbackS, fallbackL) => {
        if (!hslString || !hslString.trim) {
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }
        let str = hslString.trim();
        if (!/^hsl[a]?\(/i.test(str)) {
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }
        str = str.replace(/hsla?\(/i, '').replace(')', '').trim();
        if (str.indexOf(',') === -1) {
            str = str.replace(/\s+/g, ',');
        }
        const parts = str.split(',').map(p => p.trim()).filter(Boolean);
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        const l = parseFloat(parts[2]);
        if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) {
            return { h: fallbackH, s: fallbackS, l: fallbackL };
        }
        return { h, s, l };
    };

    const hslToString = (hsl, alpha = 1, lightnessOffset = 0) => {
        const l = Math.max(0, Math.min(100, hsl.l + lightnessOffset));
        return `hsla(${hsl.h}, ${hsl.s}%, ${l}%, ${alpha})`;
    };

    // === Color Configuration ===
    const circuitColors = {
        base: getVar('--circuit-color-base', 'hsla(239, 52%, 43%, 0.15)'),
        pulse: getVar('--circuit-color-pulse', 'hsla(256, 52%, 43%, 1.00)'),
        grid: getVar('--circuit-color-grid', 'hsla(245, 52%, 43%, 0.02)'),
        cpuGlow: getVar('--circuit-color-cpu-glow', 'hsla(252, 52%, 43%, 0.20)'),
        trailHsl: parseHsl(getVar('--circuit-color-trail', 'hsla(254, 52%, 43%, 1.00)'), 135, 52, 43),
        ledHsl: parseHsl(getVar('--circuit-color-led', 'hsla(251, 52%, 43%, 1.00)'), 135, 52, 43),
        baseHsl: parseHsl(getVar('--circuit-color-base', 'hsla(239, 52%, 43%, 0.15)'), 239, 52, 43),
        pulseHsl: parseHsl(getVar('--circuit-color-pulse', 'hsla(256, 52%, 43%, 1.00)'), 256, 52, 43)
    };

    // === State ===
    let width, height;
    let lines = [];
    let components = [];
    let processors = [];

    const config = {
        gridSize: 30,
        colorBase: circuitColors.base,
        colorPulse: circuitColors.pulse,
        trailHsl: circuitColors.trailHsl,
        trailLength: 10,
        pulseSpeed: 2,
        maxPathLength: 20,
        colorGrid: circuitColors.grid,
        ledHsl: circuitColors.ledHsl,
        cpuGlow: circuitColors.cpuGlow,
        baseHsl: circuitColors.baseHsl,
        pulseHsl: circuitColors.pulseHsl
    };

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => Math.random() * (max - min) + min;

    // === Processor Class ===
    class Processor {
        constructor(x, y, size, variant) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.variant = variant;
            this.gridConfig = this.getGridConfig();
            // Pre-generate multiple grid states for animation
            this.gridStates = this.generateGridStates(8);
            this.currentState = 0;
            this.frameCounter = 0;
            this.frameSkip = 3; // Change grid every 3 frames
        }

        getGridConfig() {
            const innerSize = this.size * 0.6;
            const gridSize = this.variant === 0 ? 8 : (this.variant === 1 ? 6 : 4);
            const padding = this.variant === 0 ? 10 : 6;
            const cols = Math.floor((innerSize - padding * 2) / gridSize);
            const rows = Math.floor((innerSize - padding * 2) / gridSize);
            return { cols, rows, gridSize, padding, innerSize };
        }

        generateGridStates(numStates) {
            const states = [];
            const { cols, rows } = this.gridConfig;

            for (let s = 0; s < numStates; s++) {
                const cells = [];
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        if (Math.random() > 0.4) {
                            cells.push({
                                x: i,
                                y: j,
                                alpha: Math.random() * 0.3 + 0.1
                            });
                        }
                    }
                }
                states.push(cells);
            }
            return states;
        }

        drawStatic(ctx) {
            const { x, y, size, variant } = this;
            const halfSize = size / 2;

            ctx.save();
            ctx.translate(x, y);

            // Glow effect
            ctx.shadowBlur = variant === 0 ? 20 : 12;
            ctx.shadowColor = config.cpuGlow;

            // Main package
            ctx.fillStyle = hslToString(config.baseHsl, 0.25, 20);
            ctx.fillRect(-halfSize, -halfSize, size, size);

            ctx.strokeStyle = config.colorPulse;
            ctx.lineWidth = variant === 0 ? 2 : 1.5;
            ctx.strokeRect(-halfSize, -halfSize, size, size);
            ctx.shadowBlur = 0;

            // Pins
            this.drawPins(ctx, size, variant);

            // Inner die background
            const innerSize = size * 0.6;
            const innerHalf = innerSize / 2;

            ctx.fillStyle = hslToString(config.baseHsl, 0.3, 26);
            ctx.fillRect(-innerHalf, -innerHalf, innerSize, innerSize);

            ctx.strokeStyle = config.colorPulse;
            ctx.lineWidth = 1;
            ctx.strokeRect(-innerHalf, -innerHalf, innerSize, innerSize);

            // Corner notch
            ctx.fillStyle = config.colorPulse;
            ctx.beginPath();
            const notchSize = variant === 0 ? 20 : (variant === 1 ? 14 : 10);
            ctx.moveTo(-halfSize, -halfSize);
            ctx.lineTo(-halfSize + notchSize, -halfSize);
            ctx.lineTo(-halfSize, -halfSize + notchSize);
            ctx.fill();

            ctx.restore();
        }

        drawAnimated(ctx) {
            // Cycle through pre-generated states
            this.frameCounter++;
            if (this.frameCounter >= this.frameSkip) {
                this.frameCounter = 0;
                this.currentState = (this.currentState + 1) % this.gridStates.length;
            }

            const { x, y, size } = this;
            const { gridSize, padding } = this.gridConfig;
            const innerSize = size * 0.6;
            const innerHalf = innerSize / 2;

            ctx.save();
            ctx.translate(x, y);

            // Draw current grid state
            const cells = this.gridStates[this.currentState];
            cells.forEach(cell => {
                ctx.globalAlpha = cell.alpha;
                ctx.fillStyle = hslToString(config.pulseHsl, 1, 5);
                ctx.fillRect(
                    -innerHalf + padding + cell.x * gridSize + 1,
                    -innerHalf + padding + cell.y * gridSize + 1,
                    gridSize - 2,
                    gridSize - 2
                );
            });
            ctx.globalAlpha = 1.0;

            ctx.restore();
        }

        drawPins(ctx, size, variant) {
            ctx.fillStyle = config.colorPulse;
            const halfSize = size / 2;
            const pinCount = variant === 0 ? 16 : (variant === 1 ? 10 : 6);
            const pinW = variant === 0 ? 6 : (variant === 1 ? 4 : 3);
            const pinH = variant === 0 ? 4 : 3;
            const spacing = size / (pinCount + 1);

            for (let i = 1; i <= pinCount; i++) {
                const offset = -halfSize + i * spacing;
                ctx.fillRect(offset - pinW / 2, -halfSize - pinH, pinW, pinH);
                ctx.fillRect(offset - pinW / 2, halfSize, pinW, pinH);
                ctx.fillRect(-halfSize - pinH, offset - pinW / 2, pinH, pinW);
                ctx.fillRect(halfSize, offset - pinW / 2, pinH, pinW);
            }
        }

        getBounds() {
            const margin = 50;
            return {
                left: this.x - this.size / 2 - margin,
                right: this.x + this.size / 2 + margin,
                top: this.y - this.size / 2 - margin,
                bottom: this.y + this.size / 2 + margin
            };
        }
    }

    // === Component Class ===
    class Component {
        constructor(processorBounds) {
            this.processorBounds = processorBounds;
            this.x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
            this.y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;
            this.type = randomInt(0, 4);
            this.blinkOffset = Math.random() * Math.PI * 2;
            this.size = randomInt(0, 1) === 0 ? config.gridSize : config.gridSize * 2;
            this.dotCorner = randomInt(0, 3); // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right

            if (this.overlapsProcessor()) {
                this.x = -100;
            }
        }

        overlapsProcessor() {
            for (const bounds of this.processorBounds) {
                if (this.x > bounds.left && this.x < bounds.right &&
                    this.y > bounds.top && this.y < bounds.bottom) {
                    return true;
                }
            }
            return false;
        }

        drawStatic(ctx) {
            if (this.x < 0 || this.type === 2) return; // Skip LEDs, they're animated

            ctx.strokeStyle = config.colorBase;
            ctx.lineWidth = 1.5;

            switch (this.type) {
                case 0: this.drawCapacitor(ctx); break;
                case 1: this.drawMiniChip(ctx); break;
                case 3: this.drawTransistor(ctx); break;
                case 4: this.drawResistor(ctx); break;
            }
        }

        drawAnimated(ctx, time) {
            if (this.x < 0 || this.type !== 2) return; // Only LEDs
            this.drawLED(ctx, time);
        }

        drawCapacitor(ctx) {
            const w = config.gridSize * 0.6;
            const h = config.gridSize * 1.2;

            ctx.beginPath();
            ctx.moveTo(this.x, this.y - h / 2 - 5);
            ctx.lineTo(this.x, this.y + h / 2 + 5);
            ctx.stroke();

            ctx.fillStyle = hslToString(config.baseHsl, 0.35, 15);
            ctx.fillRect(this.x - w / 2, this.y - h / 2, w, h);
            ctx.strokeRect(this.x - w / 2, this.y - h / 2, w, h);

            ctx.beginPath();
            ctx.moveTo(this.x - w / 2, this.y - h / 4);
            ctx.lineTo(this.x + w / 2, this.y - h / 4);
            ctx.stroke();
        }

        drawMiniChip(ctx) {
            const s = config.gridSize * 0.8;

            ctx.fillStyle = hslToString(config.baseHsl, 0.4, 18);
            ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
            ctx.strokeRect(this.x - s / 2, this.y - s / 2, s, s);

            ctx.fillStyle = config.colorPulse;
            for (let i = -1; i <= 1; i += 2) {
                ctx.fillRect(this.x - s / 2 - 3, this.y + i * 6 - 2, 3, 4);
                ctx.fillRect(this.x + s / 2, this.y + i * 6 - 2, 3, 4);
                ctx.fillRect(this.x + i * 6 - 2, this.y - s / 2 - 3, 4, 3);
                ctx.fillRect(this.x + i * 6 - 2, this.y + s / 2, 4, 3);
            }

            // Center screw head
            ctx.strokeStyle = config.colorPulse;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.stroke();
            // Screw slot (cross pattern)
            ctx.beginPath();
            ctx.moveTo(this.x - 2, this.y);
            ctx.lineTo(this.x + 2, this.y);
            ctx.moveTo(this.x, this.y - 2);
            ctx.lineTo(this.x, this.y + 2);
            ctx.stroke();
        }

        drawLED(ctx, time) {
            const alpha = (Math.sin(time * 0.005 + this.blinkOffset) + 1) / 2 * 0.5 + 0.2;
            const { h, s, l } = config.ledHsl;

            ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(2)})`;
            ctx.strokeStyle = config.colorBase;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        drawTransistor(ctx) {
            const r = config.gridSize * 0.35;

            ctx.fillStyle = hslToString(config.baseHsl, 0.35, 16);
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = hslToString(config.baseHsl, 0.4, 12);
            ctx.fillRect(this.x - r, this.y - 2, r * 2, 4);

            ctx.strokeStyle = config.colorPulse;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - r * 0.6, this.y);
            ctx.lineTo(this.x - r * 0.6, this.y + r + 8);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + r + 10);
            ctx.moveTo(this.x + r * 0.6, this.y);
            ctx.lineTo(this.x + r * 0.6, this.y + r + 8);
            ctx.stroke();
        }

        drawResistor(ctx) {
            const w = config.gridSize * 1.0;
            const h = config.gridSize * 0.3;

            ctx.strokeStyle = config.colorBase;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x - w / 2 - 8, this.y);
            ctx.lineTo(this.x + w / 2 + 8, this.y);
            ctx.stroke();

            ctx.fillStyle = hslToString(config.baseHsl, 0.35, 18);
            ctx.fillRect(this.x - w / 2, this.y - h / 2, w, h);
            ctx.strokeRect(this.x - w / 2, this.y - h / 2, w, h);

            ctx.fillStyle = hslToString(config.pulseHsl, 0.5, -5);
            ctx.fillRect(this.x - w / 3, this.y - h / 2, 3, h);
            ctx.fillStyle = hslToString(config.pulseHsl, 0.4, 10);
            ctx.fillRect(this.x - w / 6, this.y - h / 2, 3, h);
            ctx.fillStyle = hslToString(config.pulseHsl, 0.3, 20);
            ctx.fillRect(this.x + w / 8, this.y - h / 2, 3, h);
        }
    }

    // === Circuit Line Class ===
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
            this.pulseSpeed = randomFloat(0.5, 1.5) * config.pulseSpeed;
            this.hasPulse = Math.random() > 0.3;
            this.pulseDelay = randomInt(0, 100);
            this.trailHistory = [];
            this.totalLength = this.calculateTotalLength();
        }

        calculateTotalLength() {
            let total = 0;
            for (let i = 0; i < this.path.length - 1; i++) {
                const dx = this.path[i + 1].x - this.path[i].x;
                const dy = this.path[i + 1].y - this.path[i].y;
                total += Math.sqrt(dx * dx + dy * dy);
            }
            return total;
        }

        generatePath() {
            let currentX = this.x;
            let currentY = this.y;
            let currentDir = this.dir;

            for (let i = 0; i < this.length; i++) {
                const segmentLen = randomInt(2, 6) * config.gridSize;

                if (currentDir === 'x') {
                    currentX += segmentLen * (Math.random() > 0.5 ? 1 : -1);
                    currentDir = 'y';
                } else {
                    currentY += segmentLen * (Math.random() > 0.5 ? 1 : -1);
                    currentDir = 'x';
                }

                currentX = Math.max(0, Math.min(width, currentX));
                currentY = Math.max(0, Math.min(height, currentY));

                this.path.push({ x: currentX, y: currentY });
            }
        }

        drawStatic(ctx) {
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
        }

        drawPulse(ctx) {
            if (!this.hasPulse) return;

            if (this.pulseDelay > 0) {
                this.pulseDelay--;
                return;
            }

            this.pulseProgress += this.pulseSpeed;

            if (this.pulseProgress > this.totalLength) {
                this.pulseProgress = 0;
                this.pulseDelay = randomInt(20, 100);
                this.trailHistory = [];
                if (Math.random() > 0.8) this.reset();
                return;
            }

            // Find position along path
            let distanceTravelled = 0;
            let pos = { x: this.path[0].x, y: this.path[0].y };

            for (let i = 0; i < this.path.length - 1; i++) {
                const p1 = this.path[i];
                const p2 = this.path[i + 1];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (distanceTravelled + dist >= this.pulseProgress) {
                    const ratio = (this.pulseProgress - distanceTravelled) / dist;
                    pos.x = p1.x + dx * ratio;
                    pos.y = p1.y + dy * ratio;
                    break;
                }
                distanceTravelled += dist;
            }

            this.trailHistory.push({ x: pos.x, y: pos.y });
            if (this.trailHistory.length > config.trailLength) {
                this.trailHistory.shift();
            }

            // Trail dots
            const { h, s, l } = config.trailHsl;
            for (let i = 0; i < this.trailHistory.length; i++) {
                const trailPos = this.trailHistory[i];
                const alpha = (i + 1) / this.trailHistory.length;
                ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${(0.6 * alpha).toFixed(2)})`;
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

    // === Generate Processors ===
    function generateProcessors() {
        processors = [];

        const processorConfigs = [
            { size: 220, variant: 0 },
            { size: 160, variant: 1 },
            { size: 120, variant: 1 },
            { size: 90, variant: 2 },
            { size: 70, variant: 2 },
        ];

        const area = width * height;
        let count;
        if (area > 2000000) count = 5;
        else if (area > 1200000) count = 4;
        else if (area > 800000) count = 3;
        else count = 3;

        const minDistance = 200;

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPos = false;
            let x, y;
            const config = processorConfigs[i];

            while (!validPos && attempts < 150) {
                const margin = config.size + 40;
                x = randomInt(margin, width - margin);
                y = randomInt(margin, height - margin);

                validPos = true;
                for (const proc of processors) {
                    const minDist = (config.size + proc.size) / 2 + minDistance;
                    const dist = Math.sqrt((x - proc.x) ** 2 + (y - proc.y) ** 2);
                    if (dist < minDist) {
                        validPos = false;
                        break;
                    }
                }
                attempts++;
            }

            if (validPos) {
                processors.push(new Processor(x, y, config.size, config.variant));
            }
        }
    }

    // === Pre-render static elements ===
    function preRenderStatic() {
        staticCanvas = document.createElement('canvas');
        staticCanvas.width = width;
        staticCanvas.height = height;
        staticCtx = staticCanvas.getContext('2d');

        // Background grid
        staticCtx.fillStyle = config.colorGrid;
        for (let x = 0; x < width; x += config.gridSize * 4) {
            staticCtx.fillRect(x, 0, 1, height);
        }
        for (let y = 0; y < height; y += config.gridSize * 4) {
            staticCtx.fillRect(0, y, width, 1);
        }

        // Corner registration marks (PCB alignment)
        drawCornerMarks(staticCtx);

        // Vias scattered around
        drawVias(staticCtx);

        // Static circuit lines
        lines.forEach(line => line.drawStatic(staticCtx));

        // Static components (not LEDs)
        components.forEach(comp => comp.drawStatic(staticCtx));

        // Static processor parts
        processors.forEach(proc => proc.drawStatic(staticCtx));

        // Silkscreen labels near processors
        drawSilkscreenLabels(staticCtx);

        // Mounting holes in corners
        drawMountingHoles(staticCtx);

        // Test points
        drawTestPoints(staticCtx);
    }

    // === Static decorative elements ===
    function drawCornerMarks(ctx) {
        const markSize = 30;
        const offset = 15;
        ctx.strokeStyle = hslToString(config.pulseHsl, 0.25, 0);
        ctx.lineWidth = 1.5;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(offset, offset + markSize);
        ctx.lineTo(offset, offset);
        ctx.lineTo(offset + markSize, offset);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(width - offset - markSize, offset);
        ctx.lineTo(width - offset, offset);
        ctx.lineTo(width - offset, offset + markSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(offset, height - offset - markSize);
        ctx.lineTo(offset, height - offset);
        ctx.lineTo(offset + markSize, height - offset);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(width - offset - markSize, height - offset);
        ctx.lineTo(width - offset, height - offset);
        ctx.lineTo(width - offset, height - offset - markSize);
        ctx.stroke();

        // Crosshairs at corners
        const crossSize = 8;
        ctx.strokeStyle = hslToString(config.pulseHsl, 0.15, 0);
        [[offset + 8, offset + 8], [width - offset - 8, offset + 8],
        [offset + 8, height - offset - 8], [width - offset - 8, height - offset - 8]].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.moveTo(cx - crossSize, cy);
            ctx.lineTo(cx + crossSize, cy);
            ctx.moveTo(cx, cy - crossSize);
            ctx.lineTo(cx, cy + crossSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    function drawVias(ctx) {
        const processorBounds = processors.map(p => p.getBounds());
        const viaCount = Math.floor((width * height) / 25000);

        for (let i = 0; i < viaCount; i++) {
            const x = randomInt(30, width - 30);
            const y = randomInt(30, height - 30);

            // Skip if overlapping processor
            let skip = false;
            for (const bounds of processorBounds) {
                if (x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom) {
                    skip = true;
                    break;
                }
            }
            if (skip) continue;

            const outerR = randomInt(3, 5);
            const innerR = outerR * 0.5;

            // Outer copper ring
            ctx.fillStyle = hslToString(config.pulseHsl, 0.2, 5);
            ctx.beginPath();
            ctx.arc(x, y, outerR, 0, Math.PI * 2);
            ctx.fill();

            // Inner hole
            ctx.fillStyle = hslToString(config.baseHsl, 0.6, 8);
            ctx.beginPath();
            ctx.arc(x, y, innerR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawSilkscreenLabels(ctx) {
        ctx.font = '9px monospace';
        ctx.fillStyle = hslToString(config.pulseHsl, 0.2, 0);

        processors.forEach((proc, idx) => {
            const labels = ['U' + (idx + 1), 'CPU', 'MCU', 'IC' + (idx + 1), 'PROC'];
            const label = labels[idx % labels.length];
            ctx.fillText(label, proc.x - proc.size / 2, proc.y + proc.size / 2 + 12);

            // Pin 1 indicator text
            ctx.font = '7px monospace';
            ctx.fillText('1', proc.x - proc.size / 2 - 8, proc.y - proc.size / 2 + 4);
        });

        // Random board labels
        const boardLabels = ['GND', 'VCC', '3V3', '5V', 'RST', 'CLK', 'DATA', 'TX', 'RX', 'SDA', 'SCL'];
        const labelCount = Math.floor((width * height) / 150000);

        for (let i = 0; i < labelCount; i++) {
            const x = randomInt(50, width - 80);
            const y = randomInt(50, height - 50);
            const label = boardLabels[randomInt(0, boardLabels.length - 1)];
            ctx.font = '8px monospace';
            ctx.fillStyle = hslToString(config.pulseHsl, 0.15, 0);
            ctx.fillText(label, x, y);
        }

        // Board revision in corner
        ctx.font = '10px monospace';
        ctx.fillStyle = hslToString(config.pulseHsl, 0.12, 0);
        ctx.fillText('REV 2.1', width - 60, height - 35);
        ctx.fillText('PCB-001', width - 60, height - 22);
    }

    function drawMountingHoles(ctx) {
        const holeR = 12;
        const padR = 18;
        const offset = 35;
        const positions = [
            [offset, offset],
            [width - offset, offset],
            [offset, height - offset],
            [width - offset, height - offset]
        ];

        positions.forEach(([x, y]) => {
            // Copper pad
            ctx.fillStyle = hslToString(config.pulseHsl, 0.15, 5);
            ctx.beginPath();
            ctx.arc(x, y, padR, 0, Math.PI * 2);
            ctx.fill();

            // Hole
            ctx.fillStyle = hslToString(config.baseHsl, 0.5, 10);
            ctx.beginPath();
            ctx.arc(x, y, holeR, 0, Math.PI * 2);
            ctx.fill();

            // Inner ring
            ctx.strokeStyle = hslToString(config.pulseHsl, 0.1, 0);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, holeR - 2, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    function drawTestPoints(ctx) {
        const processorBounds = processors.map(p => p.getBounds());
        const tpCount = Math.floor((width * height) / 80000);

        for (let i = 0; i < tpCount; i++) {
            const x = randomInt(60, width - 60);
            const y = randomInt(60, height - 60);

            // Skip if overlapping processor
            let skip = false;
            for (const bounds of processorBounds) {
                if (x > bounds.left - 20 && x < bounds.right + 20 &&
                    y > bounds.top - 20 && y < bounds.bottom + 20) {
                    skip = true;
                    break;
                }
            }
            if (skip) continue;

            // Test point pad
            ctx.fillStyle = hslToString(config.pulseHsl, 0.25, 8);
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Center dot
            ctx.fillStyle = hslToString(config.pulseHsl, 0.4, 15);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '6px monospace';
            ctx.fillStyle = hslToString(config.pulseHsl, 0.15, 0);
            ctx.fillText('TP' + (i + 1), x - 8, y + 14);
        }
    }

    // === Initialize ===
    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        // Generate processors first
        generateProcessors();
        const processorBounds = processors.map(p => p.getBounds());

        // Generate components avoiding processors
        components = [];
        const componentCount = Math.floor((width * height) / 45000);
        for (let i = 0; i < componentCount; i++) {
            components.push(new Component(processorBounds));
        }

        // Generate circuit lines
        lines = [];
        const lineCount = Math.floor((width * height) / 30000);
        for (let i = 0; i < lineCount; i++) {
            lines.push(new CircuitLine());
        }

        // Pre-render static elements
        preRenderStatic();
    }

    // === Animation Loop (Frame-limited) ===
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    function animate(time) {
        const deltaTime = time - lastTime;

        if (deltaTime >= frameInterval) {
            lastTime = time - (deltaTime % frameInterval);

            // Draw pre-rendered static background
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(staticCanvas, 0, 0);

            // Animated processor grids
            processors.forEach(proc => proc.drawAnimated(ctx));

            // Animated LEDs
            components.forEach(comp => comp.drawAnimated(ctx, time));

            // Animated pulses
            lines.forEach(line => line.drawPulse(ctx));
        }

        requestAnimationFrame(animate);
    }

    // === Event Handlers ===
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(init, 200);
    });

    init();
    requestAnimationFrame(animate);
});
