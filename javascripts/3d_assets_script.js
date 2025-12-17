const carousel = document.getElementById("carousel");
const titleDisplay = document.getElementById("model-title");

const models = [
    {
        src: "assets/mmp_ridgeback_dualxarm.glb",
        title: "Mobile Manipulation Platform Dual xARM850",
        robot_type: "Omniwheel",
        robot_arm: "Dual Ufactory xARM850",
        Lidar: "Ouster OS1-64 | x2 Hokuyo UST-10LX",
        depth_camera: "x2 Intel Realsense D405 | ZED2i",
        rig: "MBS Rig System x3",
        gripper: "x2 Robotiq 2f-140",
        Software: "ROS2 Humble",
    },
    {
        src: "assets/h1_2.glb",
        title: "Unitree H1-2",
        robot_type: "Bi-Pedal",
        Software: "ROS2 Humble",
        Lidar: "Ouster OS1-64",
        Depth_Camera_i: "Intel Realsense D435i",
        Depth_Camera_ii: "ZED2i",
    },
    {
        src: "assets/mmp_ridgeback_ur5e.glb",
        title: "Mobile Manipulation Platform Ridgeback UR5e",
        robot_type: "Omniwheel",
        robot_arm: "Universal Robots UR5e",
        Lidar: "Ouster OS1-64 | x2 Hokuyo UST-10LX",
        depth_camera: "Intel Realsense D405",
        rig: "MBS Vertical Lift",
        gripper: "Robotiq 2f-140",
        Software: "ROS Noetic | ROS2 Humble",
    },
    {
        src: "assets/mmp_husky.glb",
        title: "Mobile Manipulation Platform Husky",
        robot_type: "Differential Drive",
        sensors: "Hokuyo UST-20LX",
        depth_camera: "Intel Realsense D435i",
    },
    {
        src: "assets/rovo3.glb",
        title: "MBS ROVO3",
        robot_type: "Tracked",
        kit: "Autonomous Mobile Robot Kit",
        Software: "ROS2 Jazzy",
    },
    {
        src: "assets/a300.glb",
        title: "Clearpath Husky A300",
        robot_type: "Differential Drive",
        sensors: "Hokuyo UST-20LX",
    },
    {
        src: "assets/agilex_hunter.glb",
        title: "Agile X Hunter 2.0",
        robot_type: "2WD",
        lidars: "Ouster OS1-64",
        gps: "Drotek GPS",
        depth_camera: "Intel Realsense D435i",
    },
    {
        src: "assets/ascento.glb",
        title: "Ascento Research",
        robot_type: "Bipedal Wheeled",
        sensors: "Livox Mid-360",
        depth_cameras: "ZED2i | Intel Realsense D435i",
        cameras: "4 Surveillance Cameras",
    },
    {
        src: "assets/mbs_rovo2.glb",
        title: "MYBOTSHOP ROVO2",
        robot_type: "Tracked",
        lidars: "Ouster OS1-64",
        gps: "Emlid RS2",
    },
    {
        src: "assets/go2.glb",
        title: "Unitree GO2",
        robot_type: "Quadruped",
        robot_arm: "Open Manipulator - X (Custom)",
        Lidar: "Ouster OS1-64",
        depth_camera: "Intel Realsense D435i",
        thermal_camera: "ZT30",
        Software: "ROS2 Foxy",
    },
    {
        src: "assets/h1.glb",
        title: "Unitree H1",
        robot_type: "Bi-Pedal",
        Software: "ROS2 Foxy",
        Depth_Camera: "Intel Realsense D435i",
        Lidar: "Livox Mid360",
    },
    {
        src: "assets/b2.glb",
        title: "Unitree B2",
        robot_type: "Quadruped",
        Software: "ROS2 Humble",
        Lidar: "Hesai Pandar",
    },
    {
        src: "assets/g1.glb",
        title: "Unitree G1",
        robot_type: "Bi-Pedal",
        Software: "ROS2 Foxy",
        Face_Led: "RGB",
        Lidar: "Livox Mid360",
    },
    { src: "assets/inspire_hands.glb", title: "Inspire Hands" },
    { src: "assets/spot.glb", title: "Boston Dynamics Spot" },
    { src: "assets/kuka.glb", title: "Kuka Robotic Arm" },
];

let currentIndex = 0;
let isTransitioning = false;
let modelElements = [];

// Calculate coverflow position for each model (infinite loop)
function getCoverflowStyles(index, current, total) {
    // Calculate shortest distance for infinite loop
    let offset = index - current;

    // Wrap around for infinite loop effect
    if (offset > total / 2) {
        offset -= total;
    } else if (offset < -total / 2) {
        offset += total;
    }

    const absOffset = Math.abs(offset);

    // Base values
    const spacing = 180; // Reduced horizontal spacing between items
    const maxRotation = 25; // Max Y rotation for side items
    const depthSpacing = 80; // Z depth for side items

    let translateX = offset * spacing;
    let translateZ = 0;
    let rotateY = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = total - absOffset;

    if (offset === 0) {
        // Center item
        translateZ = 100;
        scale = 1.3;
        zIndex = total + 1;
    } else if (offset < 0) {
        // Left side items
        rotateY = maxRotation;
        translateZ = -depthSpacing * Math.min(absOffset, 3);
        scale = Math.max(0.5, 0.85 - absOffset * 0.15);
        opacity = Math.max(0.2, 0.5 - absOffset * 0.12);
    } else {
        // Right side items
        rotateY = -maxRotation;
        translateZ = -depthSpacing * Math.min(absOffset, 3);
        scale = Math.max(0.5, 0.85 - absOffset * 0.15);
        opacity = Math.max(0.2, 0.5 - absOffset * 0.12);
    }

    // Hide items too far from center (show 2 on each side)
    if (absOffset > 2) {
        opacity = 0;
        zIndex = 0;
    }

    return {
        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity: opacity,
        zIndex: zIndex
    };
}

// Apply styles to all models
function updateCarouselPositions() {
    const total = models.length;

    modelElements.forEach((element, index) => {
        const styles = getCoverflowStyles(index, currentIndex, total);
        element.style.transform = styles.transform;
        element.style.opacity = styles.opacity;
        element.style.zIndex = styles.zIndex;

        // Only enable interaction on center item
        if (index === currentIndex) {
            element.setAttribute('camera-controls', '');
            element.setAttribute('auto-rotate', '');
            element.setAttribute('rotation-per-second', '20deg');
        } else {
            element.removeAttribute('camera-controls');
            element.removeAttribute('auto-rotate');
        }
    });
}

// Initialize carousel
function initializeCarousel() {
    carousel.innerHTML = '';
    modelElements = [];

    // Create model viewers
    models.forEach((model, index) => {
        const modelViewer = document.createElement('model-viewer');
        modelViewer.setAttribute('src', model.src);
        modelViewer.setAttribute('camera-orbit', '45deg 75deg auto');
        modelViewer.setAttribute('camera-target', 'auto auto auto');
        modelViewer.setAttribute('field-of-view', '50deg');
        modelViewer.setAttribute('min-field-of-view', '40deg');
        modelViewer.setAttribute('max-field-of-view', '60deg');
        modelViewer.setAttribute('min-camera-orbit', 'auto auto auto');
        modelViewer.setAttribute('max-camera-orbit', 'auto auto auto');
        modelViewer.setAttribute('environment-image', 'neutral');
        modelViewer.setAttribute('shadow-intensity', '1');
        modelViewer.setAttribute('exposure', '0.85');
        modelViewer.setAttribute('interpolation-decay', '100');
        modelViewer.setAttribute('interaction-prompt', 'none');
        modelViewer.className = 'carousel-model';
        modelViewer.id = `model-${index}`;

        // Click handler for non-center items
        modelViewer.addEventListener('click', () => {
            if (index !== currentIndex) {
                selectModel(index);
            }
        });

        modelElements[index] = modelViewer;
        carousel.appendChild(modelViewer);
    });

    // Create navigation buttons
    createNavButtons();

    // Initial positioning
    updateCarouselPositions();

    // Update title
    updateTitle();
}

function createNavButtons() {
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-nav-btn prev';
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
    prevBtn.addEventListener('click', () => navigateCarousel('prev'));
    carousel.appendChild(prevBtn);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-nav-btn next';
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
    nextBtn.addEventListener('click', () => navigateCarousel('next'));
    carousel.appendChild(nextBtn);
}

function selectModel(index) {
    if (isTransitioning || index === currentIndex) return;

    isTransitioning = true;
    currentIndex = index;

    updateCarouselPositions();
    updateTitle();

    // Short transition lock
    setTimeout(() => {
        isTransitioning = false;
    }, 350);
}

function navigateCarousel(direction) {
    const totalModels = models.length;
    let newIndex;

    if (direction === 'next') {
        newIndex = (currentIndex + 1) % totalModels;
    } else {
        newIndex = (currentIndex - 1 + totalModels) % totalModels;
    }

    selectModel(newIndex);
}

function updateTitle() {
    titleDisplay.style.opacity = '0';
    titleDisplay.style.transform = 'translateX(-10px)';
    const detailsDisplay = document.getElementById('model-details');
    detailsDisplay.style.opacity = '0';

    setTimeout(() => {
        const currentModel = models[currentIndex];
        titleDisplay.textContent = currentModel.title;

        // Build details HTML (exclude src and title from display)
        let detailsHTML = '';
        Object.keys(currentModel).forEach(key => {
            if (key !== 'src' && key !== 'title') {
                const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                detailsHTML += `<span class="detail-item"><span class="detail-label">${label}:</span><span class="detail-value">${currentModel[key]}</span></span>`;
            }
        });

        detailsDisplay.innerHTML = detailsHTML;
        titleDisplay.style.opacity = '1';
        titleDisplay.style.transform = 'translateX(0)';
        detailsDisplay.style.opacity = '1';
    }, 150);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        navigateCarousel('prev');
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        navigateCarousel('next');
    }
});

// Touch/swipe support
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
}, { passive: true });

carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        e.preventDefault();
        if (deltaX > 0) {
            navigateCarousel('next');
        } else {
            navigateCarousel('prev');
        }
    }

    isDragging = false;
}, { passive: false });

// Mouse wheel navigation with debounce
let wheelTimeout = null;
carousel.addEventListener('wheel', (e) => {
    if (isTransitioning) return;
    e.preventDefault();

    if (wheelTimeout) return;

    wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
    }, 250);

    if (e.deltaX > 20 || e.deltaY > 20) {
        navigateCarousel('next');
    } else if (e.deltaX < -20 || e.deltaY < -20) {
        navigateCarousel('prev');
    }
}, { passive: false });

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarousel);
} else {
    initializeCarousel();
}

// Auto-advance carousel every 20 seconds
setInterval(() => {
    if (!isTransitioning) {
        navigateCarousel('next');
    }
}, 20000);
