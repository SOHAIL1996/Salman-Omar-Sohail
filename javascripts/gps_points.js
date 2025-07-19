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
            {
                coords: [50.9667, 6.65],
                name: "DE",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [23.657, 53.971],
                name: "UAE",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [40.7128, -74.0060],
                name: "US",
                period: "Undisclosed-",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [42.83, 12.35],
                name: "IT",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [-25.735, 134.388],
                name: "AU",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [-8.986, -52.997],
                name: "BR",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [47.166, 9.521], // Liechtenstein
                name: "LI",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [56.2639, 9.5018], // Denmark
                name: "DK",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [46.2276, 2.2137], // France
                name: "FR",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [46.8182, 8.2275], // Switzerland
                name: "CH",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [26.8206, 30.8025], // Egypt
                name: "EG",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [56.1304, -106.3468], // Canada
                name: "CA",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [50.8333, 4.0000], // Belgium
                name: "BE",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
            {
                coords: [35.8616, 104.1954], // China
                name: "CN",
                period: "Undisclosed",
                description: "Robot Deployment",
                iconUrl: 'media/robots/mbsascento.png',
            },
        ];

        // Create a feature group to store all markers
        const markers = L.featureGroup();

        // Add markers from the locations list
        try {
            locations.forEach(location => {
                // Create custom icon for each location
                const customIcon = L.icon({
                    iconUrl: location.iconUrl,
                    // iconSize: location.iconSize,
                    // iconAnchor: location.iconAnchor,
                    // popupAnchor: location.popupAnchor
                    iconSize: [25, 30],
                    iconAnchor: [10, 30],
                    popupAnchor: [0, -30]
                });

                const marker = L.marker(location.coords, {
                    icon: customIcon,
                    title: location.name
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