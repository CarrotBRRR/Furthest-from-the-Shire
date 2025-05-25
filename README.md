# Furthest from the Shire

## App Features:
- Select a **home point** (by entering coordinates or a city/place name),  
- Calculate and display its **antipode** (the point directly opposite on the globe),  
- Select a **third point** by clicking on the map,  
- Draw a geodesic circle that dynamically centers either on the antipode or the home point, depending on which is closer to the third point,  

It is built using **Leaflet.js**, **Turf.js**, and **OpenStreetMap tiles** and can be deployed as a static web app (e.g., on GitHub Pages).

---

## Features

- Input **home location** by name or latitude/longitude.
- Automatic calculation and placement of the antipode marker.
- User can select and drag a **third point** anywhere on the map.
- The system draws a geodesic circle whose radius matches the distance between the third point and the closer of the two: home or antipode.
- Supports world wrapping, so circles that cross the international dateline visually connect across the map edges.
- User interface with a small control panel and a full-page interactive map.

---

## Technologies Used

- **Leaflet.js** — interactive web map rendering.
- **Turf.js** — geospatial calculations (distance, circle generation).
- **OpenStreetMap** — map tile source.
- **Nominatim API** — geocoding place names to coordinates.

---

## How to Use

1. Enter a **city name** or **latitude, longitude** pair (e.g., `51.5074, -0.1278`) into the input box.
2. Click **Set Location**. The map will mark:
   - Your entered home point.
   - Its antipode point.
3. You will be prompted to **click on the map** to choose a third point.
4. A draggable marker will appear. Drag it as desired.
5. The system will:
   - Compute the distance between the third point and both the home and antipode.
   - Draw a geodesic circle centered on whichever is closer.
   - Visually wrap the circle across map edges when appropriate.

---

## Notes
- All distance calculations are performed geodesically (not simple planar measurements).
- No API keys are required; only open services are used.

---

## Future Improvements

- Add error handling or user feedback when dragging points outside valid bounds.
- Enable mobile responsiveness and improved control layout.
- Actual geodesic circle rendering with wrapping across the map edges.

---

## License

This project is open-source and distributed under the MIT License.

## Author

Dominic Choi

## License

This project is licensed under the MIT License. See `LICENSE` for details.