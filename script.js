// script.js

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 5
}).addTo(map);

let markerHome, markerAntipode, circleZone;

document.getElementById('setLocationBtn').addEventListener('click', setHome);

function toRadians(deg) {
    return deg * Math.PI / 180;
}

function haversine(coord1, coord2) {
    const R = 6371e3;
    const [lat1, lon1] = coord1.map(toRadians);
    const [lat2, lon2] = coord2.map(toRadians);
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function calculateAntipode([lat, lon]) {
    return [-lat, ((lon + 180) % 360) - 180];
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
    const midpoint = [
        (homeCoords[0] + antipodeCoords[0]) / 2,
        (homeCoords[1] + antipodeCoords[1]) / 2
    ];
    const distance = haversine(homeCoords, antipodeCoords);
    const radius = distance / 2;

    if (markerHome) map.removeLayer(markerHome);
    if (markerAntipode) map.removeLayer(markerAntipode);
    if (circleZone) map.removeLayer(circleZone);

    markerHome = L.marker(homeCoords).addTo(map).bindPopup("Home").openPopup();
    markerAntipode = L.marker(antipodeCoords).addTo(map).bindPopup("Antipode");
    circleZone = L.circle(midpoint, {
        radius: radius,
        color: 'red',
        fillOpacity: 0.1
    }).addTo(map).bindPopup("Furthest-from-home zone");

    map.fitBounds([homeCoords, antipodeCoords]);
}
