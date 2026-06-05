// circuitry_background_script.js — Optimized with pre-rendering & multiple processors

// Guard against multiple initialization
if (!window._circuitryBackgroundInitialized) {
window._circuitryBackgroundInitialized = true;

window.addEventListener('load', () => {
    // Use an existing #circuitCanvas (landing pages provide one), otherwise
    // create it — lets the background work on Sphinx doc pages that have no
    // canvas in their template. The CSS (#circuitCanvas) positions it fixed
    // behind all content.
    let canvas = document.getElementById('circuitCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'circuitCanvas';
        document.body.insertBefore(canvas, document.body.firstChild);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === Pre-rendered canvas for static elements ===
    let staticCanvas, staticCtx;

    // === CSS Variable Helpers ===
    const getVar = (name, fallback) => {
        const rootStyles = getComputedStyle(document.documentElement);
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

    // === Color Configuration (refreshable) ===
    const refreshColors = () => {
        return {
            base: getVar('--circuit-color-base', 'hsla(143, 52%, 43%, 0.15)'),
            pulse: getVar('--circuit-color-pulse', 'hsl(133, 44%, 40%)'),
            grid: getVar('--circuit-color-grid', 'hsla(128, 52%, 43%, 0.02)'),
            cpuGlow: getVar('--circuit-color-cpu-glow', 'hsla(108, 52%, 43%, 0.2)'),
            trailHsl: parseHsl(getVar('--circuit-color-trail', 'hsl(125, 52%, 43%)'), 125, 52, 43),
            ledHsl: parseHsl(getVar('--circuit-color-led', 'hsl(123, 52%, 43%)'), 123, 52, 43),
            baseHsl: parseHsl(getVar('--circuit-color-base', 'hsla(143, 52%, 43%, 0.15)'), 143, 52, 43),
            pulseHsl: parseHsl(getVar('--circuit-color-pulse', 'hsl(133, 44%, 40%)'), 133, 44, 40)
        };
    };

    let circuitColors = refreshColors();

    // === State ===
    // viewW/viewH = visible viewport (canvas buffer). width/height = the larger
    // "world" the board is generated into, so zooming out reveals more board
    // instead of blank edges. At neutral zoom the central viewport is shown 1:1.
    let viewW, viewH;
    let width, height;
    const OVERSCAN = 1.6;   // board is this much bigger than the viewport each axis
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

    // === Update config colors from current CSS variables ===
    const updateConfigColors = () => {
        circuitColors = refreshColors();
        config.colorBase = circuitColors.base;
        config.colorPulse = circuitColors.pulse;
        config.trailHsl = circuitColors.trailHsl;
        config.colorGrid = circuitColors.grid;
        config.ledHsl = circuitColors.ledHsl;
        config.cpuGlow = circuitColors.cpuGlow;
        config.baseHsl = circuitColors.baseHsl;
        config.pulseHsl = circuitColors.pulseHsl;
    };

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => Math.random() * (max - min) + min;

    // CPU etching pools (picked once per processor so they stay stable)
    const CPU_TAGS = ['ARM-A78', 'RK3588', 'i7-12K', 'iMX8M', 'XAVIER', 'EPYC-7', 'CX-9020', 'STM32H7'];
    const CPU_SUBS = ['8-CORE', 'QUAD', '2.4GHz', '64-bit', 'SoC', 'MCU'];

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
            this.tag = CPU_TAGS[randomInt(0, CPU_TAGS.length - 1)];
            this.sub = CPU_SUBS[randomInt(0, CPU_SUBS.length - 1)];
            this.lot = Array.from({ length: 6 }, () => '0123456789ABCDEF'[randomInt(0, 15)]).join('');
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

            // Etched die markings (centred; restore() reverts textAlign)
            ctx.textAlign = 'center';
            const fs = Math.max(7, Math.round(size * 0.06));
            ctx.font = 'bold ' + fs + 'px monospace';
            ctx.fillStyle = hslToString(config.pulseHsl, 0.55, 12);
            ctx.fillText(this.tag, 0, -innerHalf * 0.28);
            if (size >= 110) {
                ctx.font = Math.max(6, Math.round(size * 0.042)) + 'px monospace';
                ctx.fillStyle = hslToString(config.pulseHsl, 0.4, 8);
                ctx.fillText(this.sub, 0, innerHalf * 0.18);
                ctx.fillStyle = hslToString(config.pulseHsl, 0.3, 4);
                ctx.fillText(this.lot, 0, innerHalf * 0.6);
            }

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
        // occ: optional occupancy grid (from buildOccupancy). When provided, the
        // routed path avoids any cell occupied by a chip/component so traces never
        // cross the silicon. Stored so reset() (called mid-animation) keeps avoiding.
        constructor(occ = null) {
            this.occ = occ;
            this.trailHistory = [];
            this.reset();
        }

        // True if the world point (x, y) lands on an occupied (chip) cell.
        pointBlocked(x, y) {
            const o = this.occ;
            if (!o) return false;
            const c = Math.floor(x / o.cell), r = Math.floor(y / o.cell);
            if (c < 0 || c >= o.cols || r < 0 || r >= o.rows) return false;
            return o.occ[r * o.cols + c] === 1;
        }

        reset() {
            // Pick a start point that is not on a chip (a few tries, then accept).
            this.x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
            this.y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;
            for (let t = 0; t < 12 && this.pointBlocked(this.x, this.y); t++) {
                this.x = Math.floor(Math.random() * (width / config.gridSize)) * config.gridSize;
                this.y = Math.floor(Math.random() * (height / config.gridSize)) * config.gridSize;
            }
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

            // Propose the next vertex for a given axis/sign. Returns clamped coords.
            const step = (axis, sign) => {
                const segmentLen = randomInt(2, 6) * config.gridSize;
                let nx = currentX, ny = currentY;
                if (axis === 'x') nx = Math.max(0, Math.min(width, currentX + segmentLen * sign));
                else ny = Math.max(0, Math.min(height, currentY + segmentLen * sign));
                return { nx, ny };
            };

            for (let i = 0; i < this.length; i++) {
                // Try the natural axis (both signs), then the other axis (both signs).
                // Accept the first segment whose endpoint is clear of any chip.
                const candidates = currentDir === 'x'
                    ? [['x', 1], ['x', -1], ['y', 1], ['y', -1]]
                    : [['y', 1], ['y', -1], ['x', 1], ['x', -1]];
                if (Math.random() > 0.5) candidates.reverse(); // keep direction variety

                let moved = false;
                for (const [axis, sign] of candidates) {
                    const { nx, ny } = step(axis, sign);
                    if (nx === currentX && ny === currentY) continue; // clamped to no-op
                    if (this.pointBlocked(nx, ny)) continue;          // would enter a chip
                    currentX = nx; currentY = ny;
                    currentDir = axis === 'x' ? 'y' : 'x';
                    this.path.push({ x: currentX, y: currentY });
                    moved = true;
                    break;
                }
                // Boxed in on all four directions by chips/edges — end the trace here.
                if (!moved) break;
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

    // ============================================================
    //  Enhanced silicon (GPU / RAM) + occupancy-aware white-space fill
    //  Fills the empty board areas with bond-wire fan-outs, little
    //  sub-circuits, ground-via stitching, copper hatch & silkscreen,
    //  and drops in a GPU (parallel-core die + HBM) and DDR RAM banks
    //  alongside the CPU cores. Colours track the live --circuit-* vars.
    // ============================================================
    const FILL_DENSITY = 0.85;
    let gpus = [], ramBanks = [], hbmStacks = [], gpuBonds = [], gpioHeaders = [], fillSet = null;
    const PA = (al, dl = 0) => hslToString(config.pulseHsl, al, dl);
    const PB = (al, dl = 0) => hslToString(config.baseHsl, al, dl);
    const rfloat = (a, b) => Math.random() * (b - a) + a;
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));

    function quadPt(x0, y0, cx, cy, x1, y1, t) { const m = 1 - t; return { x: m * m * x0 + 2 * m * t * cx + t * t * x1, y: m * m * y0 + 2 * m * t * cy + t * t * y1 }; }
    function schemSym(ctx, k) {
        const s = 7; ctx.beginPath();
        if (k === 0) { ctx.moveTo(-12, 0); ctx.lineTo(-s, 0); ctx.rect(-s, -3.5, 2 * s, 7); ctx.moveTo(s, 0); ctx.lineTo(12, 0); ctx.stroke(); }
        else if (k === 1) { ctx.moveTo(-12, 0); ctx.lineTo(-2, 0); ctx.moveTo(2, 0); ctx.lineTo(12, 0); ctx.moveTo(-2, -5); ctx.lineTo(-2, 5); ctx.moveTo(2, -5); ctx.lineTo(2, 5); ctx.stroke(); }
        else if (k === 2) { ctx.strokeRect(-s, -s, 2 * s, 2 * s); ctx.beginPath(); ctx.moveTo(-s - 3, -3); ctx.lineTo(-s, -3); ctx.moveTo(-s - 3, 3); ctx.lineTo(-s, 3); ctx.moveTo(s, -3); ctx.lineTo(s + 3, -3); ctx.moveTo(s, 3); ctx.lineTo(s + 3, 3); ctx.stroke(); }
        else { ctx.moveTo(-12, 0); ctx.lineTo(-8, 0); for (let i = 0; i < 3; i++) ctx.arc(-5 + i * 5, 0, 2.5, Math.PI, 0, false); ctx.moveTo(10, 0); ctx.lineTo(12, 0); ctx.stroke(); }
    }

    function buildOccupancy() {
        const cell = 24, cols = Math.ceil(width / cell), rows = Math.ceil(height / cell), occ = new Uint8Array(cols * rows);
        const mark = (x, y, pad = 0) => { const c0 = Math.floor((x - pad) / cell), c1 = Math.floor((x + pad) / cell), r0 = Math.floor((y - pad) / cell), r1 = Math.floor((y + pad) / cell); for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (c >= 0 && c < cols && r >= 0 && r < rows) occ[r * cols + c] = 1; };
        processors.forEach(p => mark(p.x, p.y, p.size / 2 + 40));
        components.forEach(c => { if (c.x >= 0) mark(c.x, c.y, (c.size || config.gridSize) * 0.8); });
        lines.forEach(L => { for (let i = 1; i < L.path.length; i++) { const a = L.path[i - 1], b = L.path[i], d = Math.hypot(b.x - a.x, b.y - a.y), st = Math.max(1, d / cell); for (let s = 0; s <= st; s++) mark(a.x + (b.x - a.x) * s / st, a.y + (b.y - a.y) * s / st, 8); } });
        const empty = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows && occ[r * cols + c] === 0;
        const regionEmpty = (x, y, w2, h2) => { let tot = 0, emp = 0; for (let yy = y; yy <= y + h2; yy += cell) for (let xx = x; xx <= x + w2; xx += cell) { tot++; if (empty(Math.floor(xx / cell), Math.floor(yy / cell))) emp++; } return tot ? emp / tot : 0; };
        return { cell, cols, rows, occ, mark, empty, regionEmpty };
    }

    function buildExtras(occ) {
        const { cell, mark, empty, regionEmpty } = occ; gpus = []; ramBanks = []; hbmStacks = []; gpuBonds = []; gpioHeaders = [];
        // Big silicon is drawn on the top layer, so it only needs to dodge the
        // large CPUs (and each other) — small parts/traces it simply covers.
        const EM = 30;
        // Blockers = CPUs + every small component, so the big silicon overlaps
        // ONLY the circuit lines (traces), never the chips / mini sub-circuits.
        const blockers = processors.map(p => ({ l: p.x - p.size / 2 - 28, r: p.x + p.size / 2 + 28, t: p.y - p.size / 2 - 28, b: p.y + p.size / 2 + 28 }));
        components.forEach(cp => { if (cp.x < 0) return; const e = (cp.size || config.gridSize) * 0.8 + 6; blockers.push({ l: cp.x - e, r: cp.x + e, t: cp.y - e, b: cp.y + e }); });
        const fits = (x, y, w, h, pad) => {
            if (x - w / 2 < EM || x + w / 2 > width - EM || y - h / 2 < EM || y + h / 2 > height - EM) return false;
            for (const bl of blockers) if (!(x + w / 2 + pad < bl.l || x - w / 2 - pad > bl.r || y + h / 2 + pad < bl.t || y - h / 2 - pad > bl.b)) return false;
            return true;
        };
        const addBlocker = (x, y, w, h) => blockers.push({ l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 });
        // Etching label pools — picked once at build time so they stay stable across re-renders
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        const hex = n => Array.from({ length: n }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
        const GPU_TAGS = ['GA104', 'GH100', 'AD102', 'NV-G7', 'XG90-A', 'RDNA3'];
        const GPU_SUBS = ['PCIe x16', '6144-SP', 'GEN4 x16', '256-bit'];
        const RAM_CODES = ['K4A8G16', 'MT40A1G', 'H5AN8G6', 'D9WFR', 'IS43TR'];
        const RAM_CAPS = ['4Gb', '8Gb', '16Gb'];
        const HBM_CAPS = ['8GB', '16GB', '24GB'];
        // GPUs — 2-4, count scales with board area; each clears CPUs/components/other silicon
        const gpuCount = cl(Math.round((width * height) / 1600000), 2, 4);
        for (let gi = 0; gi < gpuCount; gi++) {
            const s = cl(Math.min(width, height) * 0.16, 120, 240) * (1 - gi * 0.12); // later ones a touch smaller
            let placed = null;
            for (let a = 0; a < 800; a++) { const x = rfloat(EM + s / 2, width - EM - s / 2), y = rfloat(EM + s / 2, height - EM - s / 2 - 16);
                if (fits(x, y, s, s, 12)) { placed = { x, y, size: s, ph: Math.random() * Math.PI * 2, tag: pick(GPU_TAGS), sub: pick(GPU_SUBS), lot: 'LOT ' + hex(6) }; gpus.push(placed); addBlocker(x, y, s + 32, s + 32); mark(x, y, s / 2 + 22); break; } }
            // HBM stacks flanking this GPU
            if (placed) { const hs = placed.size / 2, hw = placed.size * 0.16, hh = placed.size * 0.52;
                for (const side of [-1, 1]) { const x = placed.x + side * (hs + hw * 0.7 + 8), y = placed.y; if (fits(x, y, hw, hh, 6)) { hbmStacks.push({ x, y, w: hw, h: hh, cap: pick(HBM_CAPS) }); addBlocker(x, y, hw + 10, hh + 10); mark(x, y, Math.max(hw, hh) / 2 + 6); } } }
        }
        // RAM banks — short rows of DDR ICs (count scales with board area)
        const ramBankCount = cl(Math.round((width * height) / 1600000), 2, 4);
        for (let bi = 0; bi < ramBankCount; bi++) { const K = 3 + (bi % 2), cw = cl(Math.min(width, height) * 0.04, 22, 38), ch = cw * 0.6, gap = cw * 0.32, bw = K * cw + (K - 1) * gap, bh = ch;
            for (let a = 0; a < 800; a++) { const cx = rfloat(EM + bw / 2, width - EM - bw / 2), cy = rfloat(EM + bh / 2, height - EM - bh / 2 - 12);
                if (fits(cx, cy, bw, bh, 12)) { const bx = cx - bw / 2, by = cy - bh / 2, chips = []; for (let k = 0; k < K; k++) { const ccx = bx + k * (cw + gap) + cw / 2; chips.push({ x: ccx, y: by + ch / 2, w: cw, h: ch, ph: Math.random() * Math.PI * 2, sp: rfloat(0.5, 2.2), code: pick(RAM_CODES) }); mark(ccx, by + ch / 2, cw * 0.7); } addBlocker(cx, cy, bw + 14, bh + 18); ramBanks.push({ chips, x: bx, y: by, label: (bi % 2 ? 'DDR5' : 'DDR4') + ' ' + pick(RAM_CAPS) }); break; } } }
        // GPIO pin headers — two rows of male pins
        const GPIO_LABELS = ['GPIO', 'J1', 'J2', 'HDR1', 'CN1', 'IO'];
        const gpioCount = cl(Math.round((width * height) / 2400000), 1, 2);
        for (let gi = 0; gi < gpioCount; gi++) { const N = 8 + Math.floor(Math.random() * 11), pp = cl(Math.min(width, height) * 0.012, 6, 9), gw = (N + 1) * pp, gh = 3 * pp;
            for (let a = 0; a < 800; a++) { const cx = rfloat(EM + gw / 2, width - EM - gw / 2), cy = rfloat(EM + gh / 2, height - EM - gh / 2 - 12);
                if (fits(cx, cy, gw, gh, 12)) { addBlocker(cx, cy, gw + 14, gh + 16); mark(cx, cy, Math.max(gw, gh) / 2 + 4); gpioHeaders.push({ x: cx, y: cy, n: N, pp, gw, gh, ph: Math.random() * Math.PI * 2, label: pick(GPIO_LABELS) }); break; } } }
        // GPU bond fan-outs (per GPU)
        for (const gpu of gpus) { const hs = gpu.size / 2, pc = 14, sp = gpu.size / (pc + 1);
            for (let side = 0; side < 4; side++) { const nrm = [[0, -1], [0, 1], [-1, 0], [1, 0]][side];
                for (let i = 1; i <= pc; i++) { if (Math.random() > 0.55) continue; const o = -hs + i * sp; let px, py;
                    if (side === 0) { px = gpu.x + o; py = gpu.y - hs; } else if (side === 1) { px = gpu.x + o; py = gpu.y + hs; } else if (side === 2) { px = gpu.x - hs; py = gpu.y + o; } else { px = gpu.x + hs; py = gpu.y + o; }
                    const dist = rfloat(28, 58), lx = px + nrm[0] * dist + (side < 2 ? rfloat(-6, 6) : 0), ly = py + nrm[1] * dist + (side < 2 ? 0 : rfloat(-6, 6));
                    if (!empty(Math.floor(lx / cell), Math.floor(ly / cell))) continue;
                    const mx = (px + lx) / 2 + nrm[1] * rfloat(-4, 4), my = (py + ly) / 2 + nrm[0] * rfloat(-4, 4) - 3;
                    gpuBonds.push({ px, py, mx, my, lx, ly, off: Math.random(), sp: rfloat(0.6, 1.3) }); mark(lx, ly, 10); } } }
    }

    function buildFill(occ) {
        const { cell, cols, rows, mark, empty } = occ; const D = FILL_DENSITY;
        const hatch = [], stitch = [], bonds = [], circuits = [], micro = [], texts = [], fids = [];
        const desig = ['R', 'C', 'U', 'D', 'Q', 'L', 'J', 'Y'];
        // bond fan-outs off each CPU
        processors.forEach(p => { const hs = p.size / 2, pc = p.variant === 0 ? 16 : p.variant === 1 ? 10 : 6, sp = p.size / (pc + 1);
            for (let side = 0; side < 4; side++) { const nrm = [[0, -1], [0, 1], [-1, 0], [1, 0]][side];
                for (let i = 1; i <= pc; i++) { if (Math.random() > 0.6 * D) continue; const o = -hs + i * sp; let px, py;
                    if (side === 0) { px = p.x + o; py = p.y - hs; } else if (side === 1) { px = p.x + o; py = p.y + hs; } else if (side === 2) { px = p.x - hs; py = p.y + o; } else { px = p.x + hs; py = p.y + o; }
                    const dist = rfloat(30, 68), lx = px + nrm[0] * dist + (side < 2 ? rfloat(-7, 7) : 0), ly = py + nrm[1] * dist + (side < 2 ? 0 : rfloat(-7, 7));
                    if (!empty(Math.floor(lx / cell), Math.floor(ly / cell))) continue;
                    const mx = (px + lx) / 2 + nrm[1] * rfloat(-5, 5), my = (py + ly) / 2 + nrm[0] * rfloat(-5, 5) - 3;
                    bonds.push({ px, py, mx, my, lx, ly, off: Math.random(), sp: rfloat(0.6, 1.3) }); mark(lx, ly, 12); } } });
        // little sub-circuits in the voids
        const circN = Math.floor((cols * rows) / 48 * D);
        for (let i = 0; i < circN; i++) { let c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rows); if (!empty(c, r)) continue; const n = 2 + Math.floor(Math.random() * 3), cps = []; let cc = c, rr = r;
            for (let k = 0; k < n; k++) { if (k > 0) { const dd = [[2, 0], [0, 2], [-2, 0], [0, -2]][Math.floor(Math.random() * 4)]; const nc = cl(cc + dd[0], 0, cols - 1), nr = cl(rr + dd[1], 0, rows - 1); if (!empty(nc, nr)) break; cc = nc; rr = nr; } const x = cc * cell + cell / 2, y = rr * cell + cell / 2; cps.push({ x, y, k: Math.floor(Math.random() * 4), rot: Math.random() < 0.4 }); mark(x, y, 16); }
            if (cps.length >= 2) { const nets = []; for (let k = 1; k < cps.length; k++) nets.push([cps[k - 1], cps[k]]); circuits.push({ cps, nets, off: Math.random(), sp: rfloat(0.5, 1.1), lbl: desig[Math.floor(Math.random() * desig.length)] + (1 + Math.floor(Math.random() * 99)) }); } }
        // copper hatch in big voids + ground-via stitching + micro stubs + silkscreen
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!empty(c, r)) continue; if (empty(c - 1, r) && empty(c + 1, r) && empty(c, r - 1) && empty(c, r + 1) && Math.random() < 0.85 * D) hatch.push({ x: c * cell, y: r * cell }); }
        for (let r = 0; r < rows; r += 2) for (let c = 0; c < cols; c += 2) { if (empty(c, r) && Math.random() < 0.6 * D) stitch.push({ x: c * cell + cell / 2, y: r * cell + cell / 2, ph: Math.random() * Math.PI * 2 }); }
        const microN = Math.floor((cols * rows) / 32 * D);
        for (let i = 0; i < microN; i++) { let c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rows); if (!empty(c, r)) continue; let x = c * cell + cell / 2, y = r * cell + cell / 2; const path = [{ x, y }]; let dir = Math.floor(Math.random() * 4); const D4 = [[1, 0], [0, 1], [-1, 0], [0, -1]]; const segs = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < segs; s++) { if (Math.random() < 0.5) dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4; const ln = 1 + Math.floor(Math.random() * 2); const nc = c + D4[dir][0] * ln, nr = r + D4[dir][1] * ln; if (!empty(nc, nr)) break; c = nc; r = nr; x = c * cell + cell / 2; y = r * cell + cell / 2; path.push({ x, y }); }
            if (path.length >= 2) micro.push(path); }
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (!empty(c, r)) continue; const x = c * cell + cell / 2, y = r * cell + cell / 2; if (Math.random() < 0.05 * D) texts.push({ x: x - 6, y: y + 3, s: desig[Math.floor(Math.random() * desig.length)] + (1 + Math.floor(Math.random() * 99)) }); else if (Math.random() < 0.04 * D) fids.push({ x, y }); }
        fillSet = { hatch, stitch, bonds, circuits, micro, texts, fids, cell };
    }

    // Place the big silicon (GPU/RAM/HBM/GPIO) and return the occupancy grid with
    // CPUs + components + that silicon marked. Lines are routed against this grid
    // afterwards so traces never cross any chip; fill runs last (after lines).
    function placeSilicon() { const o = buildOccupancy(); buildExtras(o); return o; }

    function drawFillersStatic(c) {
        const F = fillSet; if (!F) return; const cs = F.cell;
        c.lineWidth = 1; c.strokeStyle = PA(0.12, 10);
        for (const hp of F.hatch) { c.beginPath(); c.moveTo(hp.x, hp.y + cs); c.lineTo(hp.x + cs, hp.y); c.moveTo(hp.x, hp.y + cs * 0.5); c.lineTo(hp.x + cs * 0.5, hp.y); c.moveTo(hp.x + cs * 0.5, hp.y + cs); c.lineTo(hp.x + cs, hp.y + cs * 0.5); c.stroke(); }
        for (const m of F.micro) { c.strokeStyle = PA(0.2); c.beginPath(); c.moveTo(m[0].x, m[0].y); for (let i = 1; i < m.length; i++) c.lineTo(m[i].x, m[i].y); c.stroke(); c.fillStyle = PA(0.3); c.beginPath(); c.arc(m[0].x, m[0].y, 1.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(m[m.length - 1].x, m[m.length - 1].y, 1.4, 0, Math.PI * 2); c.fill(); }
        for (const b of F.bonds) { c.strokeStyle = PA(0.34, 6); c.lineWidth = 1; c.beginPath(); c.moveTo(b.px, b.py); c.quadraticCurveTo(b.mx, b.my, b.lx, b.ly); c.stroke(); c.fillStyle = PB(0.6, 8); c.fillRect(b.lx - 2.5, b.ly - 2.5, 5, 5); c.strokeStyle = PA(0.6, 10); c.strokeRect(b.lx - 2.5, b.ly - 2.5, 5, 5); }
        for (const cir of F.circuits) { c.strokeStyle = PA(0.28); c.lineWidth = 1.2; for (const net of cir.nets) { const a = net[0], bb = net[1]; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, a.y); c.lineTo(bb.x, bb.y); c.stroke(); c.fillStyle = PA(0.45); c.beginPath(); c.arc(bb.x, a.y, 1.5, 0, Math.PI * 2); c.fill(); }
            c.strokeStyle = PA(0.6, 6); c.lineWidth = 1.2; for (const cp of cir.cps) { c.save(); c.translate(cp.x, cp.y); if (cp.rot) c.rotate(Math.PI / 2); schemSym(c, cp.k); c.restore(); }
            c.font = '6px monospace'; c.fillStyle = PA(0.32); c.fillText(cir.lbl, cir.cps[0].x + 7, cir.cps[0].y - 6); }
        for (const s of F.stitch) { c.fillStyle = PA(0.26, 2); c.beginPath(); c.arc(s.x, s.y, 2.2, 0, Math.PI * 2); c.fill(); c.fillStyle = PB(0.65, 6); c.beginPath(); c.arc(s.x, s.y, 1, 0, Math.PI * 2); c.fill(); }
        c.font = '6px monospace'; c.fillStyle = PA(0.24); for (const tx of F.texts) c.fillText(tx.s, tx.x, tx.y);
        c.strokeStyle = PA(0.26); c.lineWidth = 1; for (const f of F.fids) { c.beginPath(); c.moveTo(f.x - 3, f.y); c.lineTo(f.x + 3, f.y); c.moveTo(f.x, f.y - 3); c.lineTo(f.x, f.y + 3); c.stroke(); }
    }

    function drawExtrasStatic(c) {
        for (const b of gpuBonds) { c.strokeStyle = PA(0.22, 6); c.lineWidth = 1; c.beginPath(); c.moveTo(b.px, b.py); c.quadraticCurveTo(b.mx, b.my, b.lx, b.ly); c.stroke(); c.fillStyle = PB(0.5, 8); c.fillRect(b.lx - 2.5, b.ly - 2.5, 5, 5); c.strokeStyle = PA(0.45, 10); c.strokeRect(b.lx - 2.5, b.ly - 2.5, 5, 5); }
        for (const gpu of gpus) { const g = gpu, hs = g.size / 2, rr = g.size * 0.11; c.save(); c.translate(g.x, g.y);
            // rounded-rect helper (distinguishes the GPU from the square, legged CPU)
            const rrect = (x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); } };
            // substrate package — rounded, with an inner guard ring
            c.shadowBlur = 18; c.shadowColor = config.cpuGlow;
            c.fillStyle = PB(0.25, 20); rrect(-hs, -hs, g.size, g.size, rr); c.fill();
            c.strokeStyle = config.colorPulse; c.lineWidth = 2.5; rrect(-hs, -hs, g.size, g.size, rr); c.stroke(); c.shadowBlur = 0;
            c.strokeStyle = PA(0.35, 8); c.lineWidth = 1; rrect(-hs + 5, -hs + 5, g.size - 10, g.size - 10, rr * 0.7); c.stroke();
            // BGA solder-ball ring inside the edge (vs the CPU's outward legs)
            c.fillStyle = config.colorPulse; const band = hs - 11, bn = 9, bsp = (band * 2) / (bn - 1);
            for (let i = 0; i < bn; i++) for (let j = 0; j < bn; j++) { if (i > 0 && i < bn - 1 && j > 0 && j < bn - 1) continue; c.beginPath(); c.arc(-band + i * bsp, -band + j * bsp, 1.6, 0, Math.PI * 2); c.fill(); }
            // central die split into a 2x2 grid of GPC core clusters
            const ih = g.size * 0.40; c.fillStyle = PB(0.3, 26); c.fillRect(-ih, -ih, ih * 2, ih * 2); c.strokeStyle = config.colorPulse; c.lineWidth = 1; c.strokeRect(-ih, -ih, ih * 2, ih * 2);
            c.strokeStyle = PA(0.4, 6); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -ih); c.lineTo(0, ih); c.moveTo(-ih, 0); c.lineTo(ih, 0); c.stroke();
            // round pin-1 marker (vs the CPU's corner triangle)
            c.fillStyle = config.colorPulse; c.beginPath(); c.arc(-hs + rr + 3, -hs + rr + 3, 3, 0, Math.PI * 2); c.fill();
            // etched die markings (centred; save/restore reverts textAlign)
            c.textAlign = 'center';
            c.font = 'bold ' + Math.max(8, Math.round(g.size * 0.075)) + 'px monospace'; c.fillStyle = PA(0.6, 12); c.fillText(g.tag, 0, -ih * 0.42);
            c.font = Math.max(6, Math.round(g.size * 0.05)) + 'px monospace'; c.fillStyle = PA(0.42, 8); c.fillText(g.sub, 0, -ih * 0.12);
            c.fillStyle = PA(0.3, 6); c.fillText(g.lot, 0, ih * 0.72);
            c.restore();
            c.font = '11px monospace'; c.fillStyle = PA(0.55); c.fillText('GPU', g.x - hs, g.y + hs + 14); }
        for (const hb of hbmStacks) { c.fillStyle = PB(0.4, 18); c.fillRect(hb.x - hb.w / 2, hb.y - hb.h / 2, hb.w, hb.h); c.strokeStyle = config.colorPulse; c.lineWidth = 1.2; c.strokeRect(hb.x - hb.w / 2, hb.y - hb.h / 2, hb.w, hb.h); c.strokeStyle = PA(0.28); for (let y = hb.y - hb.h / 2 + 5; y < hb.y + hb.h / 2; y += 5) { c.beginPath(); c.moveTo(hb.x - hb.w / 2, y); c.lineTo(hb.x + hb.w / 2, y); c.stroke(); } c.textAlign = 'center'; c.font = '7px monospace'; c.fillStyle = PA(0.42); c.fillText('HBM', hb.x, hb.y + hb.h / 2 + 9); c.font = '6px monospace'; c.fillStyle = PA(0.3); c.fillText(hb.cap, hb.x, hb.y + hb.h / 2 + 17); c.textAlign = 'left'; }
        for (const bank of ramBanks) { for (const ch of bank.chips) { const hw = ch.w / 2, hh = ch.h / 2; c.fillStyle = PB(0.3, 16); c.fillRect(ch.x - hw, ch.y - hh, ch.w, ch.h); c.strokeStyle = config.colorPulse; c.lineWidth = 1.4; c.strokeRect(ch.x - hw, ch.y - hh, ch.w, ch.h); c.fillStyle = config.colorPulse; const np = 6, sp = ch.w / (np + 1); for (let i = 1; i <= np; i++) { const o = ch.x - hw + i * sp; c.fillRect(o - 1.5, ch.y - hh - 3, 3, 3); c.fillRect(o - 1.5, ch.y + hh, 3, 3); } c.fillStyle = PA(0.85); c.beginPath(); c.arc(ch.x - hw + 4, ch.y - hh + 4, 1.5, 0, Math.PI * 2); c.fill(); c.textAlign = 'center'; c.font = '5px monospace'; c.fillStyle = PA(0.4, 10); c.fillText(ch.code.slice(0, 5), ch.x, ch.y + 1.5); c.textAlign = 'left'; }
            c.font = '8px monospace'; c.fillStyle = PA(0.45); c.fillText(bank.label, bank.x, bank.y - 5); }
        for (const gp of gpioHeaders) { const { x, y, n, pp, gw, gh } = gp, x0 = x - (n - 1) * pp / 2, ry = pp / 2;
            c.strokeStyle = config.colorPulse; c.lineWidth = 1.2; c.strokeRect(x - gw / 2, y - gh / 2, gw, gh);
            for (let i = 0; i < n; i++) for (const r of [-1, 1]) { const px = x0 + i * pp, py = y + r * ry; c.fillStyle = PA(0.55, 6); c.fillRect(px - 1.6, py - 1.6, 3.2, 3.2); c.fillStyle = PB(0.7, 4); c.beginPath(); c.arc(px, py, 0.9, 0, Math.PI * 2); c.fill(); }
            c.strokeStyle = PA(0.7, 10); c.lineWidth = 1; c.strokeRect(x0 - 2.4, y - ry - 2.4, 4.8, 4.8);
            c.textAlign = 'center'; c.font = '7px monospace'; c.fillStyle = PA(0.45); c.fillText(gp.label, x, y + gh / 2 + 9); c.textAlign = 'left'; }
    }

    function drawExtrasDynamic(c, time) {
        for (const gpu of gpus) { const g = gpu, ih = g.size * 0.40, cs = Math.max(5, g.size * 0.04), n = Math.floor((ih * 2 - 4) / cs);
            for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) { const a = (Math.sin(time * 0.005 - (cx + cy) * 0.3 + g.ph) + 1) / 2, al = a * a * 0.5; if (al < 0.05) continue; c.fillStyle = PA(al, 5); c.fillRect(g.x - ih + 2 + cx * cs + 0.5, g.y - ih + 2 + cy * cs + 0.5, cs - 1, cs - 1); } }
        for (const b of gpuBonds) { const u = ((time * 0.0006 * b.sp + b.off) % 1), q = quadPt(b.px, b.py, b.mx, b.my, b.lx, b.ly, u); c.fillStyle = PA(0.85, 18); c.beginPath(); c.arc(q.x, q.y, 1.3, 0, Math.PI * 2); c.fill(); }
        for (const bank of ramBanks) { for (const ch of bank.chips) { const g = (Math.sin(time * 0.003 * ch.sp + ch.ph) + 1) / 2, fl = g * g, a = 0.06 + fl * 0.5; c.fillStyle = PA(a, 12); c.fillRect(ch.x - ch.w / 2 + 2, ch.y - ch.h / 2 + 2, ch.w - 4, ch.h - 4); c.fillStyle = PA(0.05 + fl * 0.3, 6); for (let yy = ch.y - ch.h / 2 + 4; yy < ch.y + ch.h / 2 - 2; yy += 4) c.fillRect(ch.x - ch.w / 2 + 3, yy, ch.w - 6, 1); } }
        // GPIO — a soft glow scans across the pins
        for (const gp of gpioHeaders) { const { x, y, n, pp } = gp, x0 = x - (n - 1) * pp / 2, ry = pp / 2, act = (Math.sin(time * 0.0016 + gp.ph) * 0.5 + 0.5) * (n - 1);
            for (let i = 0; i < n; i++) { const d = Math.abs(i - act); if (d > 1.5) continue; const a = (1 - d / 1.5) * 0.7; for (const r of [-1, 1]) { c.fillStyle = PA(a, 16); c.beginPath(); c.arc(x0 + i * pp, y + r * ry, 1.8, 0, Math.PI * 2); c.fill(); } } }
    }

    function drawFillersDynamic(c, time) {
        const F = fillSet; if (!F) return;
        for (const s of F.stitch) { const g = (Math.sin(time * 0.0018 + s.ph) + 1) / 2; if (g > 0.82) { c.fillStyle = PA((g - 0.82) * 2.2, 18); c.beginPath(); c.arc(s.x, s.y, 1.6, 0, Math.PI * 2); c.fill(); } }
        for (const b of F.bonds) { const u = ((time * 0.0006 * b.sp + b.off) % 1), q = quadPt(b.px, b.py, b.mx, b.my, b.lx, b.ly, u); c.fillStyle = PA(0.85, 18); c.beginPath(); c.arc(q.x, q.y, 1.3, 0, Math.PI * 2); c.fill(); }
        for (const cir of F.circuits) { const seg = cir.nets.length; if (!seg) continue; const uu = ((time * 0.0004 * cir.sp + cir.off) % 1) * seg, si = Math.min(seg - 1, Math.floor(uu)), f = uu - si, a = cir.nets[si][0], b = cir.nets[si][1], s1 = Math.abs(b.x - a.x), s2 = Math.abs(b.y - a.y), tot = s1 + s2 + 0.01, dd = f * tot; let px, py; if (dd < s1) { px = a.x + (b.x - a.x) * (dd / s1); py = a.y; } else { px = b.x; py = a.y + (b.y - a.y) * ((dd - s1) / s2); } c.fillStyle = PA(0.8, 15); c.beginPath(); c.arc(px, py, 1.5, 0, Math.PI * 2); c.fill(); }
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

        // White-space fill — sits behind the original board elements
        drawFillersStatic(staticCtx);

        // Corner registration marks (PCB alignment)
        drawCornerMarks(staticCtx);

        // Static circuit lines
        lines.forEach(line => line.drawStatic(staticCtx));

        // Static components (not LEDs)
        components.forEach(comp => comp.drawStatic(staticCtx));

        // Static processor parts
        processors.forEach(proc => proc.drawStatic(staticCtx));

        // Enhanced silicon (GPU / RAM / HBM) — drawn on the chip layer
        drawExtrasStatic(staticCtx);

        // Silkscreen labels near processors
        drawSilkscreenLabels(staticCtx);

        // Mounting holes in corners — disabled per design request
    }

    // === Static decorative elements ===
    function drawCornerMarks(_ctx) {
        // PCB corner registration brackets + crosshair circles disabled per design request.
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

    // === Initialize ===
    function init() {
        // Cap the backing-store resolution to the physical screen size. Browser
        // zoom-out (Ctrl-) inflates window.innerWidth well past the real screen,
        // which would balloon this canvas AND the 1.6x world into a memory/CPU
        // sink. screen.width/height stay constant across zoom, so at 100% the
        // canvas renders 1:1 (sharp) and only a zoom-out gets downscaled. The
        // canvas is CSS width:100%/height:100%, so the browser stretches to fill.
        const ABS_MAX = 2880; // safety ceiling for very large/multi-monitor setups
        const capX = Math.min(window.screen.width || ABS_MAX, ABS_MAX);
        const capY = Math.min(window.screen.height || ABS_MAX, ABS_MAX);
        const cssW = window.innerWidth, cssH = window.innerHeight;
        const rscale = Math.min(1, capX / cssW, capY / cssH);
        viewW = canvas.width = Math.round(cssW * rscale);
        viewH = canvas.height = Math.round(cssH * rscale);
        // World is larger than the viewport so a zoom-out reveals surrounding board.
        width = Math.round(viewW * OVERSCAN);
        height = Math.round(viewH * OVERSCAN);

        // 1. Processors (CPUs) — placed first with collision spacing.
        generateProcessors();
        const processorBounds = processors.map(p => p.getBounds());

        // 2. Components (resistors/caps/LEDs/mini-chips) — avoid the processors.
        components = [];
        const componentCount = Math.floor((width * height) / 45000);
        for (let i = 0; i < componentCount; i++) {
            components.push(new Component(processorBounds));
        }

        // 3. Big silicon (GPU/RAM/HBM/GPIO). Returns an occupancy grid with every
        //    chip + component marked. Done BEFORE lines so traces can route around
        //    all the "bits and bobs", not the other way round.
        const occ = placeSilicon();

        // 4. Circuit lines — routed against the occupancy grid so no trace crosses
        //    any chip.
        lines = [];
        const lineCount = Math.floor((width * height) / 52000);
        for (let i = 0; i < lineCount; i++) {
            lines.push(new CircuitLine(occ));
        }

        // 5. Mark the routed traces into the same grid, then lay the white-space
        //    fill so fillers avoid both the chips and the new traces.
        lines.forEach(L => {
            for (let i = 1; i < L.path.length; i++) {
                const a = L.path[i - 1], b = L.path[i];
                const d = Math.hypot(b.x - a.x, b.y - a.y), st = Math.max(1, d / occ.cell);
                for (let s = 0; s <= st; s++) occ.mark(a.x + (b.x - a.x) * s / st, a.y + (b.y - a.y) * s / st, 8);
            }
        });
        buildFill(occ);

        // Pre-render static elements
        preRenderStatic();

        // If the animation is paused (low fps), repaint the frozen board at the new size.
        if (fpsDecided && !fpsActive) freezeStatic();
    }

    // === Animation Loop (Frame-limited) ===
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    let animationFrameId = null;

    // === FPS gate: only animate if the display sustains >= 100fps ===
    // Measured from the raw rAF cadence (the display refresh), NOT the 30fps draw
    // cap. Decided once over a short warm-up, then fixed — a continuous pause/resume
    // would oscillate (pausing frees the GPU, fps climbs back, it resumes, repeat).
    const FPS_MIN = 0; // gate disabled: always animate regardless of display refresh rate
    const WARMUP_MS = 1300;     // measurement window
    const WARMUP_SKIP_MS = 300; // ignore initial load jank
    let fpsActive = true, fpsDecided = false, warmStart = null, lastRaf = 0, rafCount = 0, rafElapsed = 0;

    // Freeze on a clean, neutral (un-zoomed, un-panned) board.
    function freezeStatic() {
        ctx.clearRect(0, 0, viewW, viewH);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.translate(viewW / 2, viewH / 2);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(staticCanvas, 0, 0);
        ctx.restore();
    }

    // === Zoom: hold, then a single slow zoom-out and back in ===
    // Scale is relative: 1.0 = neutral (central viewport shown 1:1, most zoomed in).
    // ZOOM_OUT = 1/OVERSCAN reveals the entire generated board.
    let seqStart = null;
    const HOLD_MS = 4000;        // stationary before anything moves
    const OUT_MS = 3500;         // duration of the zoom-out
    const PAUSE_MS = 1500;       // hold at the zoomed-out view
    const IN_MS = 3500;          // duration of the zoom back in
    const ZOOM_OUT = 1 / OVERSCAN;
    const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Returns the current zoom factor for a given timestamp (1.0 = neutral).
    function getZoom(time) {
        if (seqStart === null) seqStart = time;
        const t = time - seqStart;
        if (t < HOLD_MS) return 1;
        const t1 = t - HOLD_MS;
        if (t1 < OUT_MS) return 1 + (ZOOM_OUT - 1) * easeInOut(t1 / OUT_MS);
        const t2 = t1 - OUT_MS;
        if (t2 < PAUSE_MS) return ZOOM_OUT;
        const t3 = t2 - PAUSE_MS;
        if (t3 < IN_MS) return ZOOM_OUT + (1 - ZOOM_OUT) * easeInOut(t3 / IN_MS);
        return 1;
    }

    // Slow drift for variation, clamped to the slack the current zoom leaves so
    // it never exposes a blank edge. X and Y use different periods so the path
    // traces a gentle Lissajous curve rather than a straight diagonal.
    const PAN_SPEED_X = 0.00012; // rad/ms -> ~52s cycle
    const PAN_SPEED_Y = 0.00009; // rad/ms -> ~70s cycle
    const PAN_FRAC = 0.6;        // fraction of available slack to use
    function getPanX(time, z) {
        if (seqStart === null) seqStart = time;
        const slack = Math.max(0, (width * z - viewW) / 2);
        const target = Math.sin((time - seqStart) * PAN_SPEED_X) * slack * PAN_FRAC;
        return Math.max(-slack, Math.min(slack, target));
    }
    function getPanY(time, z) {
        if (seqStart === null) seqStart = time;
        const slack = Math.max(0, (height * z - viewH) / 2);
        const target = Math.sin((time - seqStart) * PAN_SPEED_Y) * slack * PAN_FRAC;
        return Math.max(-slack, Math.min(slack, target));
    }

    function animate(time) {
        // --- warm-up FPS measurement (raw rAF cadence) ---
        if (!fpsDecided) {
            if (warmStart === null) { warmStart = time; lastRaf = time; }
            const d = time - lastRaf; lastRaf = time;
            if (time - warmStart > WARMUP_SKIP_MS && d > 0 && d < 200) { rafElapsed += d; rafCount++; }
            if (time - warmStart >= WARMUP_MS) {
                const fps = rafCount > 0 ? (rafCount * 1000) / rafElapsed : 0;
                fpsDecided = true;
                if (fps < FPS_MIN) { fpsActive = false; freezeStatic(); return; } // pause: stop the loop
            }
        }
        if (!fpsActive) return; // paused — do not draw or reschedule

        const deltaTime = time - lastTime;

        if (deltaTime >= frameInterval) {
            lastTime = time - (deltaTime % frameInterval);

            ctx.clearRect(0, 0, viewW, viewH);

            // Map the (larger) world onto the viewport: at z=1 the central
            // viewport is shown 1:1; smaller z zooms out to reveal more board.
            const z = getZoom(time);
            const panX = getPanX(time, z);
            const panY = getPanY(time, z);
            ctx.save();
            ctx.translate(viewW / 2 + panX, viewH / 2 + panY);
            ctx.scale(z, z);
            ctx.translate(-width / 2, -height / 2);

            // Draw pre-rendered static background
            ctx.drawImage(staticCanvas, 0, 0);

            // Animated processor grids
            processors.forEach(proc => proc.drawAnimated(ctx));

            // Animated LEDs
            components.forEach(comp => comp.drawAnimated(ctx, time));

            // Animated pulses
            lines.forEach(line => line.drawPulse(ctx));

            // Enhanced silicon + white-space fill animation
            drawExtrasDynamic(ctx, time);
            drawFillersDynamic(ctx, time);

            ctx.restore();
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            // Reset baseline so the resumed frame doesn't see a huge/NaN delta,
            // and let rAF supply a real timestamp (animate() with no arg = NaN).
            lastTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    // === Event Handlers ===
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(init, 200);
    });

    // === Theme Change Observer ===
    // Watch for theme class changes on <html> element and re-render with new colors
    const themeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Theme class changed, update colors and re-render
                updateConfigColors();
                // Re-render static elements with new colors
                preRenderStatic();
            }
        }
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    init();
    animationFrameId = requestAnimationFrame(animate);
});
} // End of initialization guard
