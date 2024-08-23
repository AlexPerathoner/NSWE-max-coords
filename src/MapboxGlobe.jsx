// src/GlobeComponent.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";


const MapboxGlobe = () => {
  const mapContainerRef = useRef(null);
  
  useEffect(() => {

    // read token from environment variables
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      zoom: 1.5,
      center: [30, 50],
      projection: 'globe',  // Enables the globe projection
    });

    // Add atmosphere style
    map.on('load', () => {
      map.setFog({}); // Set default atmosphere style
    });

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