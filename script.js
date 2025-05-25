// Initialize the map
const map = L.map('map', { 
    center: [0, 0],
    zoomControl: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    dragging: false,
    worldCopy: true,
}).setView([0, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

let markerHome, markerAntipode, markerThird, circlePolygon;

function calculateAntipode([lat, lon]) {
    let antiLat = -lat;
    let antiLon = lon + 180;
    if (antiLon > 180) antiLon -= 360;
    if (antiLon < -180) antiLon += 360;
    return [antiLat, antiLon];
}

function drawGeodesicCircle(centerCoords, radiusMeters) {
    if (circlePolygon) map.removeLayer(circlePolygon);

    const center = turf.point([centerCoords[1], centerCoords[0]]); // [lon, lat]
    const radiusKm = radiusMeters / 1000;

    const options = {steps: 128, units: 'kilometers'};
    const circle = turf.circle(center, radiusKm, options);

    const latLngs = circle.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

    circlePolygon = L.polygon(latLngs, {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2
    }).addTo(map).bindPopup(`Radius: ${radiusKm.toFixed(2)} km`).openPopup();
}

function haversine(coord1, coord2) {
    const R = 6371e3; // meters
    const toRadians = deg => deg * Math.PI / 180;

    const [lat1, lon1] = coord1.map(toRadians);
    const [lat2, lon2] = coord2.map(toRadians);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Button to set "home" point either by coordinates or place name
document.getElementById('setLocationBtn').addEventListener('click', () => {
    const input = document.getElementById('locationInput').value.trim();
    const status = document.getElementById('status');
    status.textContent = 'Searching...';

    const coordMatch = input.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[3]);
        setHome([lat, lon]);
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
            setHome([lat, lon], input);
            status.textContent = '';
        })
        .catch(err => {
            status.textContent = 'Error retrieving location.';
            console.error(err);
        });
});

// Set home point and antipode, prepare for third point selection
function setHome(homeCoords, inputLabel) {
    if (markerHome) map.removeLayer(markerHome);
    if (markerAntipode) map.removeLayer(markerAntipode);
    if (markerThird) map.removeLayer(markerThird);
    if (circlePolygon) map.removeLayer(circlePolygon);

    markerHome = L.marker(homeCoords).addTo(map).bindPopup(inputLabel).openPopup();

    const antipodeCoords = calculateAntipode(homeCoords);
    markerAntipode = L.marker(antipodeCoords).addTo(map).bindPopup('Antipode').openPopup();

    alert('Now click on the map to select a third point.');

    map.once('click', (e) => {
        if (markerThird) map.removeLayer(markerThird);
        if (circlePolygon) map.removeLayer(circlePolygon);

        const thirdCoords = [e.latlng.lat, e.latlng.lng];
        // Make marker draggable
        markerThird = L.marker(thirdCoords, { draggable: true }).addTo(map).bindPopup('Drag Me!').openPopup();

        // Draw initial circle
        updateCircle();

        // On dragging the third point, update the circle
        if(markerThird) map.removeLayer(markerThird);
        markerThird = L.marker(thirdCoords, { draggable: true }).addTo(map).bindPopup('Drag Me!').openPopup();

        markerThird.on('drag', (event) => {
            const marker = event.target;
            const pos = marker.getLatLng();
            const bounds = map.getBounds();

            let lat = pos.lat;
            let lng = pos.lng;

            // Clamp latitude and longitude within bounds
            if (lat > bounds.getNorth()) lat = bounds.getNorth();
            if (lat < bounds.getSouth()) lat = bounds.getSouth();
            if (lng > bounds.getEast()) lng = bounds.getEast();
            if (lng < bounds.getWest()) lng = bounds.getWest();

            // If position was outside bounds, reset marker position
            if (lat !== pos.lat || lng !== pos.lng) {
                marker.setLatLng([lat, lng]);
            }

            updateCircle(); // your existing function to update the circle
        });


        // Utility function to recalc distance and redraw circle
        function updateCircle() {
            if (circlePolygon) map.removeLayer(circlePolygon);

            const currentThird = markerThird.getLatLng();

            // Turf points for home, antipode, and third
            const homePt = turf.point([markerHome.getLatLng().lng, markerHome.getLatLng().lat]);
            const antipodePt = turf.point([markerAntipode.getLatLng().lng, markerAntipode.getLatLng().lat]);
            const thirdPt = turf.point([currentThird.lng, currentThird.lat]);

            // Distances in meters
            const distToHome = turf.distance(homePt, thirdPt, { units: 'meters' });
            const distToAntipode = turf.distance(antipodePt, thirdPt, { units: 'meters' });

            // Decide which center to use
            let centerCoords, radiusMeters;
            if (distToHome < distToAntipode) {
                centerCoords = [markerHome.getLatLng().lat, markerHome.getLatLng().lng];
                radiusMeters = distToHome;
            } else {
                centerCoords = [markerAntipode.getLatLng().lat, markerAntipode.getLatLng().lng];
                radiusMeters = distToAntipode;
            }

            drawGeodesicCircle(centerCoords, radiusMeters);
        }
    });
}

