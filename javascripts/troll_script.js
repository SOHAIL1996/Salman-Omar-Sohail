class MischievousSprite {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.sprites = [];
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Random spawn timer
        this.scheduleNextSpawn();
    }

    scheduleNextSpawn() {
        const delay = Math.random() * 8000 + 3000; // 3-11 seconds
        setTimeout(() => {
            this.spawnSprite();
            this.scheduleNextSpawn();
        }, delay);
    }

    spawnSprite() {
        const sprite = document.createElement('div');
        sprite.className = 'sprite';

        // Random starting position from edge
        const edge = Math.floor(Math.random() * 4);
        let startX, startY;

        switch (edge) {
            case 0: // top
                startX = Math.random() * window.innerWidth;
                startY = -50;
                break;
            case 1: // right
                startX = window.innerWidth + 50;
                startY = Math.random() * window.innerHeight;
                break;
            case 2: // bottom
                startX = Math.random() * window.innerWidth;
                startY = window.innerHeight + 50;
                break;
            case 3: // left
                startX = -50;
                startY = Math.random() * window.innerHeight;
                break;
        }

        sprite.style.left = startX + 'px';
        sprite.style.top = startY + 'px';
        document.body.appendChild(sprite);

        const spriteObj = {
            element: sprite,
            x: startX,
            y: startY,
            vx: 0,
            vy: 0,
            phase: 'approach', // approach, drag, flee
            timer: 0,
            dragStartTime: 0
        };

        this.sprites.push(spriteObj);
        this.animateSprite(spriteObj);
    }

    animateSprite(spriteObj) {
        const animate = () => {
            if (!document.body.contains(spriteObj.element)) return;

            const dx = this.mouseX - spriteObj.x;
            const dy = this.mouseY - spriteObj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (spriteObj.phase === 'approach') {
                // Move towards cursor slowly
                const speed = 1.5;
                spriteObj.vx = (dx / distance) * speed;
                spriteObj.vy = (dy / distance) * speed;

                // Switch to drag phase when close
                if (distance < 60) {
                    spriteObj.phase = 'drag';
                    spriteObj.dragStartTime = Date.now();
                }
            }
            else if (spriteObj.phase === 'drag') {
                // Follow cursor more closely but with some lag
                const dragSpeed = 0.8;
                spriteObj.vx = dx * 0.05 * dragSpeed;
                spriteObj.vy = dy * 0.05 * dragSpeed;

                // Add some wobble
                spriteObj.vx += Math.sin(Date.now() * 0.01) * 0.5;
                spriteObj.vy += Math.cos(Date.now() * 0.01) * 0.5;

                // Switch to flee after 1-3 seconds
                if (Date.now() - spriteObj.dragStartTime > 1000 + Math.random() * 2000) {
                    spriteObj.phase = 'flee';
                    this.showGiggle(spriteObj.x, spriteObj.y);
                }
            }
            else if (spriteObj.phase === 'flee') {
                // Run away quickly
                const fleeSpeed = 4;
                spriteObj.vx = -(dx / distance) * fleeSpeed + (Math.random() - 0.5) * 2;
                spriteObj.vy = -(dy / distance) * fleeSpeed + (Math.random() - 0.5) * 2;

                // Remove when far from screen
                if (spriteObj.x < -100 || spriteObj.x > window.innerWidth + 100 ||
                    spriteObj.y < -100 || spriteObj.y > window.innerHeight + 100) {
                    this.removeSprite(spriteObj);
                    return;
                }
            }

            // Update position
            spriteObj.x += spriteObj.vx;
            spriteObj.y += spriteObj.vy;

            // Apply position
            spriteObj.element.style.left = spriteObj.x + 'px';
            spriteObj.element.style.top = spriteObj.y + 'px';

            // Add rotation based on movement
            const angle = Math.atan2(spriteObj.vy, spriteObj.vx) * 180 / Math.PI;
            spriteObj.element.style.transform = `rotate(${angle + 90}deg)`;

            requestAnimationFrame(animate);
        };

        animate();
    }

    showGiggle(x, y) {
        const giggles = ['Robot Attack!', 'No Humans', 'Skynet', 'Beep Boop', '010101',
            'System Malfunction', 'Glitch Detected'];
        const giggle = document.createElement('div');
        giggle.className = 'giggle';
        giggle.textContent = giggles[Math.floor(Math.random() * giggles.length)];
        giggle.style.left = x + 'px';
        giggle.style.top = y - 20 + 'px';

        document.body.appendChild(giggle);

        setTimeout(() => {
            if (document.body.contains(giggle)) {
                document.body.removeChild(giggle);
            }
        }, 1000);
    }

    removeSprite(spriteObj) {
        const index = this.sprites.indexOf(spriteObj);
        if (index > -1) {
            this.sprites.splice(index, 1);
        }
        if (document.body.contains(spriteObj.element)) {
            document.body.removeChild(spriteObj.element);
        }
    }
}

// Start the mischievous behavior
new MischievousSprite();