// src/GlobeComponent.jsx
import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

const GlobeComponent = () => {
  const globeEl = useRef();

  useEffect(() => {
    // Example to focus on a specific point on the globe
    globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2 }, 4000);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      />
    </div>
  );
};

export default GlobeComponent;
