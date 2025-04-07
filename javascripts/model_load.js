// javascripts/model_scripts.js

document.addEventListener('DOMContentLoaded', () => {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
        const modelViewer = item.querySelector('model-viewer');
        const loadButton = document.createElement('button');
        loadButton.textContent = `Load Model ${index + 1}`;
        loadButton.classList.add('load-model-button'); // Optional styling

        if (modelViewer && modelViewer.dataset.src) {
            // Initially hide the model viewer
            modelViewer.style.display = 'none';

            loadButton.addEventListener('click', () => {
                const src = modelViewer.dataset.src;
                if (src && !modelViewer.getAttribute('src')) {
                    modelViewer.setAttribute('src', src);
                    modelViewer.removeAttribute('data-src');
                    modelViewer.style.display = 'block'; // Show the model viewer
                    loadButton.style.display = 'none'; // Hide the button after loading
                    console.log(`Loading model: ${src}`);
                }
            });

            // Insert the button before the model viewer
            item.insertBefore(loadButton, modelViewer);
        }
    });
});