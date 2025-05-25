// Main logic for the Furthest from the Shire web app

// Initialize the map
const map = L.map('map', {
    worldCopyJump: true
}).setView([0, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 5
}).addTo(map);

let markerHome, markerAntipode, circleZone;

document.getElementById('setLocationBtn').addEventListener('click', setHome);

function toRadians(deg) {
    // Convert degrees to radians
    return deg * Math.PI / 180;
}

function haversine(coord1, coord2) {
    // Haversine formula to calculate the distance between two points on the Earth
    // given their latitude and longitude in degrees
    // Returns the distance in meters

    const R = 6371e3;
    const [lat1, lon1] = coord1.map(toRadians);
    const [lat2, lon2] = coord2.map(toRadians);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;

    return 2 * R * Math.asin(Math.sqrt(a));
}

function calculateAntipode([lat, lon]) {
    // Calculate the antipode of a given latitude and longitude
    // The antipode is the point on the Earth's surface that is diametrically opposite to the given point
    // Returns the antipode coordinates as [latitude, longitude]

    const antiLat = -lat;
    const antiLon = lon + 180;

    while(antiLon > 180) {
        antiLon -= 360;
    }

    return [antiLat, antiLon];
}

function setHome() {
    const input = document.getElementById('locationInput').value.trim();
    const status = document.getElementById('status');
    status.textContent = 'Searching...';

    const coordMatch = input.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[3]);
        updateMap([lat, lon]);
        status.textContent = '';
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                status.textContent = 'Location not found.';
                return;
            }
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            updateMap([lat, lon]);
            status.textContent = '';
        })
        .catch(err => {
            status.textContent = 'Error retrieving location.';
            console.error(err);
        });
}

function updateMap(homeCoords) {
    const antipodeCoords = calculateAntipode(homeCoords);
    const distance = haversine(homeCoords, antipodeCoords) / 2; // Half the distance for the circle radius

    // Remove existing layers if they exist
    if (markerHome) map.removeLayer(markerHome);
    if (markerAntipode) map.removeLayer(markerAntipode);
    if (circleZone) map.removeLayer(circleZone);

    // Add markers for home and antipode
    markerHome = L.marker(homeCoords).addTo(map).bindPopup("Home").openPopup();
    markerAntipode = L.marker(antipodeCoords).addTo(map).bindPopup("Antipode");

    // Draw a geodesic circle centered on the antipode with a radius equal to the distance to the home location
    circleZone = new L.greatCircle(antipodeCoords, {
        radius: distance,
        color: 'red',
        fillOpacity: 0
    }).addTo(map).bindPopup("Zone equidistant from Home to Antipode");

    // Adjust the map view to include both points
    map.fitBounds([homeCoords, antipodeCoords]);
}



