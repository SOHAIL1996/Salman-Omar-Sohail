const carousel = document.getElementById("carousel");
const titleDisplay = document.getElementById("model-title");

const models = [
    { src: "assets/agilex_hunter.glb", title: "Agile X Hunter 2.0" },
    { src: "assets/mmp_ridgeback.glb", title: "Mobile Manipulation Platform Ridgeback UR5e" },
    { src: "assets/mmp_husky.glb", title: "Mobile Manipulation Platform Husky" },
    { src: "assets/ascento.glb", title: "Ascento Research" },
    { src: "assets/g1.glb", title: "Unitree G1" },
    { src: "assets/go2.glb", title: "Unitree GO2" },
    { src: "assets/inspire_hands.glb", title: "Inspire Hands" },
    { src: "assets/h1.glb", title: "Unitree H1" },
    { src: "assets/spot.glb", title: "Boston Dynamics Spot" },
    { src: "assets/kuka.glb", title: "Kuka Robotic Arm" },
    { src: "assets/ur10.glb", title: "Universal Robot 10e" },
    { src: "assets/dingo.glb", title: "Clearpath Dingo" },
    { src: "assets/b2.glb", title: "Unitree B2" },
];

let currentIndex = 0;
let isTransitioning = false;

// Create all model viewers upfront
function initializeCarousel() {
    carousel.innerHTML = ''; // Clear existing content
    
    models.forEach((model, index) => {
        const modelViewer = document.createElement('model-viewer');
        modelViewer.setAttribute('src', model.src);
        modelViewer.setAttribute('camera-orbit', '45deg 60deg');
        modelViewer.setAttribute('environment-image', 'neutral');
        modelViewer.setAttribute('shadow-intensity', '1');
        modelViewer.setAttribute('exposure', '0.5');
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.setAttribute('auto-rotate-speed', '2');
        modelViewer.className = 'carousel-model';
        modelViewer.id = `model-${index}`;
        
        // Add click handler for background models
        modelViewer.addEventListener('click', () => {
            if (index !== currentIndex && !isTransitioning) {
                // Calculate direction to target
                const direction = getShortestDirection(currentIndex, index);
                navigateToModel(index, direction);
            }
        });
        
        // Add hover effects for background models
        modelViewer.addEventListener('mouseenter', () => {
            if (index !== currentIndex) {
                modelViewer.style.filter = 'blur(0px) brightness(1.1)';
                modelViewer.style.transform = modelViewer.style.transform.replace(/scale\([^)]*\)/, match => {
                    const scale = parseFloat(match.match(/scale\(([^)]*)\)/)[1]);
                    return `scale(${Math.min(scale * 1.05, 0.8)})`;
                });
            }
        });
        
        modelViewer.addEventListener('mouseleave', () => {
            if (index !== currentIndex) {
                updateModelPosition(modelViewer, index);
            }
        });
        
        // Set initial positions and styles
        updateModelPosition(modelViewer, index);
        
        carousel.appendChild(modelViewer);
    });
    
    // Update title
    titleDisplay.textContent = models[currentIndex].title;
    
    // Enable auto-rotate for center model
    updateAutoRotate();
}

function getShortestDirection(from, to) {
    const totalModels = models.length;
    const forward = (to - from + totalModels) % totalModels;
    const backward = (from - to + totalModels) % totalModels;
    
    return forward <= backward ? 'next' : 'prev';
}

function navigateToModel(targetIndex, direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    
    const navigate = () => {
        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % models.length;
        } else {
            currentIndex = (currentIndex - 1 + models.length) % models.length;
        }
        
        updateCarousel();
        
        if (currentIndex !== targetIndex) {
            setTimeout(navigate, 200); // Faster transitions when clicking background models
        } else {
            setTimeout(() => {
                isTransitioning = false;
            }, 600);
        }
    };
    
    navigate();
}

function updateModelPosition(modelViewer, modelIndex) {
    const relativePosition = getRelativePosition(modelIndex);
    
    if (relativePosition === 0) {
        // Center model - main focus
        modelViewer.style.cssText = `
            width: 45%;
            height: 100%;
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            z-index: 5;
            border-radius: 20px;
        `;
    } else if (relativePosition === -1) {
        // Previous model (back left)
        modelViewer.style.cssText = `
            width: 35%;
            height: 85%;
            opacity: 0.4;
            transform: translateX(-100%) translateY(10%) scale(0.7);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 2;
            border-radius: 15px;
            filter: blur(1px);
        `;
    } else if (relativePosition === 1) {
        // Next model (back right)
        modelViewer.style.cssText = `
            width: 35%;
            height: 85%;
            opacity: 0.4;
            transform: translateX(100%) translateY(10%) scale(0.7);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 2;
            border-radius: 15px;
            filter: blur(1px);
        `;
    } else if (relativePosition === -2) {
        // Far previous model (far back left)
        modelViewer.style.cssText = `
            width: 25%;
            height: 70%;
            opacity: 0.2;
            transform: translateX(-200%) translateY(20%) scale(0.5);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 1;
            border-radius: 10px;
            filter: blur(2px);
        `;
    } else if (relativePosition === 2) {
        // Far next model (far back right)
        modelViewer.style.cssText = `
            width: 25%;
            height: 70%;
            opacity: 0.2;
            transform: translateX(200%) translateY(20%) scale(0.5);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 1;
            border-radius: 10px;
            filter: blur(2px);
        `;
    } else {
        // Hidden models (completely out of view)
        modelViewer.style.cssText = `
            width: 20%;
            height: 60%;
            opacity: 0;
            transform: translateX(${relativePosition > 0 ? '300%' : '-300%'}) translateY(30%) scale(0.3);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 0;
            filter: blur(3px);
        `;
    }
}

function getRelativePosition(modelIndex) {
    let diff = modelIndex - currentIndex;
    
    // Handle wraparound
    if (diff > models.length / 2) {
        diff -= models.length;
    } else if (diff < -models.length / 2) {
        diff += models.length;
    }
    
    return diff;
}

function updateCarousel() {
    models.forEach((_, index) => {
        const modelViewer = document.getElementById(`model-${index}`);
        if (modelViewer) {
            updateModelPosition(modelViewer, index);
        }
    });
    
    // Update title with smooth transition
    titleDisplay.style.opacity = '0';
    setTimeout(() => {
        titleDisplay.textContent = models[currentIndex].title;
        titleDisplay.style.opacity = '1';
    }, 150);
    
    updateAutoRotate();
}

function updateAutoRotate() {
    models.forEach((_, index) => {
        const modelViewer = document.getElementById(`model-${index}`);
        if (modelViewer) {
            if (index === currentIndex) {
                modelViewer.setAttribute('auto-rotate', '');
            } else {
                modelViewer.removeAttribute('auto-rotate');
            }
        }
    });
}

function prevModel() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    currentIndex = (currentIndex - 1 + models.length) % models.length;
    updateCarousel();
    
    setTimeout(() => {
        isTransitioning = false;
    }, 600);
}

function nextModel() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    currentIndex = (currentIndex + 1) % models.length;
    updateCarousel();
    
    setTimeout(() => {
        isTransitioning = false;
    }, 600);
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevModel();
    } else if (e.key === 'ArrowRight') {
        nextModel();
    }
});

// Add touch/swipe support for mobile
let startX = 0;
let isDragging = false;

carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
});

carousel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
});

carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) {
            nextModel();
        } else {
            prevModel();
        }
    }
    
    isDragging = false;
});

// Add smooth title transitions
titleDisplay.style.transition = 'opacity 0.3s ease-in-out';

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeCarousel();
});

// Fallback if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarousel);
} else {
    initializeCarousel();
}