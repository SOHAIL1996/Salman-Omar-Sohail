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
        src: "assets/a200.glb",
        title: "Mobile Manipulation Platform Husky",
        robot_type: "Differential Drive",
        sensors: "Hokuyo UST-20LX",
        depth_camera: "Intel Realsense D435i",

    },
    {
        src: "assets/rovo3.glb",
        title: "MBS ROVO3",
        robot_type: "Tracked",
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
    
    // { src: "assets/ur10.glb", title: "Universal Robot 10e" },
    // { src: "assets/dingo.glb", title: "Clearpath Dingo" },
];

let currentIndex = 0;
let isTransitioning = false;
let modelElements = [];

// Initialize carousel once
function initializeCarousel() {
    // Clear any existing content
    carousel.innerHTML = '';
    modelElements = [];

    // Create all model viewers
    models.forEach((model, index) => {
        const modelViewer = document.createElement('model-viewer');
        modelViewer.setAttribute('src', model.src);
        modelViewer.setAttribute('camera-orbit', '45deg 60deg');
        modelViewer.setAttribute('environment-image', 'neutral');
        modelViewer.setAttribute('shadow-intensity', '1');
        modelViewer.setAttribute('exposure', '0.8');
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.className = 'carousel-model';
        modelViewer.id = `model-${index}`;

        // Store reference
        modelElements[index] = modelViewer;

        // Add click handler for background models
        modelViewer.addEventListener('click', (e) => {
            if (index !== currentIndex && !isTransitioning) {
                e.preventDefault();
                e.stopPropagation();
                jumpToModel(index);
            }
        });

        // Add hover effects for non-center models
        modelViewer.addEventListener('mouseenter', () => {
            if (index !== currentIndex && !isTransitioning) {
                modelViewer.style.filter = getModelFilter(index) + ' brightness(1.2)';
            }
        });

        modelViewer.addEventListener('mouseleave', () => {
            if (index !== currentIndex && !isTransitioning) {
                modelViewer.style.filter = getModelFilter(index);
            }
        });

        carousel.appendChild(modelViewer);
    });

    // Set initial positions
    updateAllPositions();
    updateTitle();
}

function getRelativePosition(modelIndex) {
    let diff = modelIndex - currentIndex;
    const totalModels = models.length;

    // Handle wraparound for shortest path
    if (diff > totalModels / 2) {
        diff -= totalModels;
    } else if (diff < -totalModels / 2) {
        diff += totalModels;
    }

    return diff;
}

function getModelStyles(relativePosition) {
    switch (relativePosition) {
        case 0: // Center model
            return {
                width: '50%',
                height: '90%',
                opacity: '1',
                transform: 'translateX(0) translateY(0) scale(1)',
                zIndex: '10',
                pointerEvents: 'auto'
            };
        case -1: // Left model
            return {
                width: '35%',
                height: '75%',
                opacity: '0.4',
                transform: 'translateX(-80%) translateY(8%) scale(0.8)',
                zIndex: '5',
                pointerEvents: 'auto'
            };
        case 1: // Right model
            return {
                width: '35%',
                height: '75%',
                opacity: '0.3',
                transform: 'translateX(80%) translateY(8%) scale(0.8)',
                zIndex: '5',
                pointerEvents: 'auto'
            };
        case -2: // Far left
            return {
                width: '25%',
                height: '60%',
                opacity: '0.1',
                transform: 'translateX(-180%) translateY(15%) scale(0.6)',
                zIndex: '2',
                pointerEvents: 'none'
            };
        case 2: // Far right
            return {
                width: '25%',
                height: '60%',
                opacity: '0.1',
                transform: 'translateX(180%) translateY(15%) scale(0.6)',
                zIndex: '2',
                pointerEvents: 'none'
            };
        default: // Hidden models
            return {
                width: '20%',
                height: '50%',
                opacity: '0',
                transform: `translateX(${relativePosition > 0 ? '300%' : '-300%'}) translateY(25%) scale(0.4)`,
                zIndex: '1',
                pointerEvents: 'none'
            };
    }
}

function getModelFilter(modelIndex) {
    const relativePosition = getRelativePosition(modelIndex);
    const styles = getModelStyles(relativePosition);
    return styles.filter;
}

function updateModelPosition(modelIndex) {
    const modelViewer = modelElements[modelIndex];
    if (!modelViewer) return;

    const relativePosition = getRelativePosition(modelIndex);
    const styles = getModelStyles(relativePosition);

    // Apply styles
    Object.keys(styles).forEach(property => {
        if (property === 'zIndex') {
            modelViewer.style.zIndex = styles[property];
        } else if (property === 'pointerEvents') {
            modelViewer.style.pointerEvents = styles[property];
        } else {
            modelViewer.style[property] = styles[property];
        }
    });

    // Handle auto-rotate
    if (relativePosition === 0) {
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('auto-rotate-speed', '30');
    } else {
        modelViewer.removeAttribute('auto-rotate');
    }
}

function updateAllPositions() {
    models.forEach((_, index) => {
        updateModelPosition(index);
    });
}

function updateTitle() {
    titleDisplay.style.opacity = '0';
    const detailsDisplay = document.getElementById('model-details');
    detailsDisplay.style.opacity = '0';

    setTimeout(() => {
        const currentModel = models[currentIndex];
        titleDisplay.textContent = currentModel.title;

        // Build details HTML
        let detailsHTML = '';
        Object.keys(currentModel).forEach(key => {
            if (key !== 'src' && key !== 'title') {
                const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                detailsHTML += `<span class="detail-item"><span class="detail-label">${label}:</span> <span class="detail-value">${currentModel[key]}</span></span>`;
            }
        });

        detailsDisplay.innerHTML = detailsHTML;
        titleDisplay.style.opacity = '1';
        detailsDisplay.style.opacity = '1';
    }, 150);
}

function navigateCarousel(direction) {
    if (isTransitioning) return;

    isTransitioning = true;

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % models.length;
    } else {
        currentIndex = (currentIndex - 1 + models.length) % models.length;
    }

    updateAllPositions();
    updateTitle();

    // Re-enable navigation after transition
    setTimeout(() => {
        isTransitioning = false;
    }, 600);
}

function jumpToModel(targetIndex) {
    if (isTransitioning || targetIndex === currentIndex) return;

    isTransitioning = true;
    currentIndex = targetIndex;

    updateAllPositions();
    updateTitle();

    setTimeout(() => {
        isTransitioning = false;
    }, 600);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        navigateCarousel('prev');
    } else if (e.key === 'ArrowRight') {
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

    // Check if it's a horizontal swipe (not vertical scroll)
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

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarousel);
} else {
    initializeCarousel();
}

setInterval(() => {
    if (!isTransitioning) {
        navigateCarousel('next');
    }
}, 10000);