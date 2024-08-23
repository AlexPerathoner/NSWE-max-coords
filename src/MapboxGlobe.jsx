// src/GlobeComponent.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import coordinates from "./coordinates.json"; // Import the JSON file


const MapboxGlobe = () => {
  const mapContainerRef = useRef(null);
  const user = "alexpera";

  useEffect(() => {
    // read token from environment variables
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    const { start, maxEast, maxWest, maxNorth, maxSouth } = coordinates[user];  // todo check if user is set first

    // Define the coordinates of the square
    const bounds = [
      [maxWest, maxSouth], // Southwest corner
      [maxEast, maxSouth], // Southeast corner
      [maxEast, maxNorth], // Northeast corner
      [maxWest, maxNorth], // Northwest corner
      [maxWest, maxSouth]  // Back to Southwest corner
    ];
    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      zoom: 4,
      center: [start.lng, start.lat],
      projection: 'globe',  // Enables the globe projection
    });

    // Add atmosphere style
    map.on('load', () => {
      map.setFog({}); // Set default atmosphere style

      // Add the square as a GeoJSON layer
      map.addSource("square", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [bounds]
          }
        }
      });

      map.addLayer({
        id: "square-layer",
        type: "fill",
        source: "square",
        layout: {},
        paint: {
          "fill-color": "#ff0000", // Red color for the square
          "fill-opacity": 0.5
        }
      });
    }, [user]);

    // Clean up on component unmount
    return () => map.remove();
  }, []);

  return (
    <div>
      {/* The container for the Mapbox GL map */}
      <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};

export default MapboxGlobe;