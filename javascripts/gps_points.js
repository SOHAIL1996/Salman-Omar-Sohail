document.addEventListener('DOMContentLoaded', function () {
    try {
        // Check if map container exists
        if (!document.getElementById('experience-map')) {
            console.error('Map container not found');
            return;
        }

        // Initialize the map
        const map = L.map('experience-map').setView([30, 0], 2);

        // Add error handling for tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 10,
            minZoom: 3
        }).addTo(map).on('tileerror', function () {
            console.error('Failed to load map tiles');
        });

        // List of locations with lat, long, name, and other info
        const locations = [
            { coords: [50.9667, 6.65], name: "DE", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [23.657, 53.971], name: "UAE", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [40.7128, -74.0060], name: "US", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [42.83, 12.35], name: "IT", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [-25.735, 134.388], name: "AU", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [-8.986, -52.997], name: "BR", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [47.166, 9.521], name: "LI", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [56.2639, 9.5018], name: "DK", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [46.2276, 2.2137], name: "FR", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [46.8182, 8.2275], name: "CH", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [26.8206, 30.8025], name: "EG", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [56.1304, -106.3468], name: "CA", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [50.8333, 4.0000], name: "BE", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [35.8616, 104.1954], name: "CN", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [63.4305, 10.3951], name: "NO", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [61.9241, 25.7482], name: "FI", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [55.3781, -3.4360], name: "UK", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [47.5162, 14.5501], name: "AT", period: "Undisclosed", description: "Robot Deployment" },
            { coords: [41.9028, 12.4964], name: "Rome", period: "Undisclosed", description: "Robot Deployment" },
        ];

        // Create a feature group to store all markers
        const markers = L.featureGroup();

        // Add markers from the locations list
        try {
            locations.forEach(location => {
                const marker = L.circleMarker(location.coords, {
                    radius: 8,
                    fillColor: '#4a5568',
                    color: '#2d3748',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.85
                }).addTo(map)
                    .bindPopup(`
                            <strong>${location.name}</strong><br>
                            <em>${location.period}</em><br>
                            ${location.description}
                        `);

                markers.addLayer(marker);
            });

            // Fit map to show all markers with some padding
            if (locations.length > 0) {
                map.fitBounds(markers.getBounds().pad(0.5));
            }

        } catch (markerError) {
            console.error('Error creating markers:', markerError);
        }
    } catch (mapError) {
        console.error('Error initializing map:', mapError);
    }
});