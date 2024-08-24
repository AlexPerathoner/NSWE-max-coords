import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import CustomModal from './Modal';

const MapboxGlobe = () => {
  const mapContainerRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [map, setMap] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [boundsInfo, setBoundsInfo] = useState({
    maxEast: null,
    maxWest: null,
    maxNorth: null,
    maxSouth: null,
    area: null,
    percOfTotal: null,
  });
  const [boundaryPoints, setBoundaryPoints] = useState({
    maxEast: null,
    maxWest: null,
    maxNorth: null,
    maxSouth: null
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Retrieve username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      // Prompt for username if not already stored
      const inputUsername = prompt("Enter your username:");
      if (inputUsername) {
        localStorage.setItem('username', inputUsername);
        setUsername(inputUsername);
      } else {
        alert("Username is required!");
        return;
      }
    } else {
      setUsername(storedUsername);
    }
    
    if (mapContainerRef.current) {
      // Mapbox access token
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

      // Initialize the map
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v11',
        zoom: 4,
        center: [52.0, 55.0],
        projection: 'globe',
      });

      mapInstance.on('load', () => {
        setMap(mapInstance);
        fetchPointsData(mapInstance, storedUsername); // Pass mapInstance and username to fetchPointsData
      });

      // Right-click to add points
      mapInstance.on('contextmenu', (e) => {
        setSelectedPoint([e.lngLat.lng, e.lngLat.lat]);
        setCurrentAction('add');
        setModalIsOpen(true);
      });

      // Click to delete points
      mapInstance.on('click', (e) => {
        if (mapInstance) {
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ['points-layer']
          });
          if (features.length > 0) {
            const featureId = features[0].properties.id;
            setSelectedPoint(featureId);
            setCurrentAction('delete');
            setModalIsOpen(true);
          }
        }
      });

      // Clean up on component unmount
      return () => mapInstance.remove();
    }
  }, []);

  const fetchPointsData = async (mapInstance, user) => {
    if (!mapInstance) return;

    try {
      const response = await fetch(`http://localhost:5002/api/points?user=${user}`);
      const data = await response.json();

      setPoints(data || []);
      updateMapData(mapInstance, data || []);
    } catch (error) {
      console.error('Error fetching points data:', error);
    }
  };

  const updatePointsDataOnServer = async (updatedPoints, user) => {
    try {
      await fetch(`http://localhost:5002/api/points?user=${user}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updatedPoints }),
      });
    } catch (error) {
      console.error('Error updating points data:', error);
    }
  };

  const updateMapData = (mapInstance, updatedPoints = points) => {
    if (!mapInstance) return; // Ensure mapInstance is not null

    if (!Array.isArray(updatedPoints)) {
      console.error('updatedPoints is not an array:', updatedPoints);
      return;
    }

    // Calculate bounds if points exist, otherwise use a default bound
    let bounds;
    let boundaryPoints = {
      maxEast: null,
      maxWest: null,
      maxNorth: null,
      maxSouth: null
    };
    if (updatedPoints.length > 0) {
      const lats = updatedPoints.map(point => point[1]);
      const lngs = updatedPoints.map(point => point[0]);
      // Find boundary points
      const maxEast = Math.max(...lngs);
      const maxWest = Math.min(...lngs);
      const maxNorth = Math.max(...lats);
      const maxSouth = Math.min(...lats);
      bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      // find the boundary points. save the index of the point in the array
      boundaryPoints.maxEast = updatedPoints.findIndex(point => point[0] === maxEast);
      boundaryPoints.maxWest = updatedPoints.findIndex(point => point[0] === maxWest);
      boundaryPoints.maxNorth = updatedPoints.findIndex(point => point[1] === maxNorth);
      boundaryPoints.maxSouth = updatedPoints.findIndex(point => point[1] === maxSouth);
      setBoundaryPoints(boundaryPoints);
    } else {
      // Use a default bounding box if no points exist
      bounds = [
        [0, 0],
        [0, 0],
      ];
    }

    // Update GeoJSON source for points
    if (mapInstance.getSource('points')) {
      mapInstance.getSource('points').setData({
        type: 'FeatureCollection',
        features: updatedPoints.map((point, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point,
          },
          properties: {
            id: index,
          },
        })),
      });
    } else {
      mapInstance.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: updatedPoints.map((point, index) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point,
            },
            properties: {
              id: index,
            },
          })),
        },
      });

      mapInstance.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ff0000',
        },
      });

      // Add text layer for labels
      mapInstance.addLayer({
        id: 'labels-layer',
        type: 'symbol',
        source: 'points',
        layout: {
          'symbol-placement': 'point',
          'text-field': '{id}', // Use index as label
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, -1.7],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#fff',
        },
      });
    }

    // Update GeoJSON source for bounds
    if (mapInstance.getSource('bounds')) {
      mapInstance.getSource('bounds').setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [bounds[0][0], bounds[0][1]],
                [bounds[1][0], bounds[0][1]],
                [bounds[1][0], bounds[1][1]],
                [bounds[0][0], bounds[1][1]],
                [bounds[0][0], bounds[0][1]],
              ]],
            },
          },
        ],
      });
    } else {
      mapInstance.addSource('bounds', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [bounds[0][0], bounds[0][1]],
                  [bounds[1][0], bounds[0][1]],
                  [bounds[1][0], bounds[1][1]],
                  [bounds[0][0], bounds[1][1]],
                  [bounds[0][0], bounds[0][1]],
                ]],
              },
            },
          ],
        },
      });

      mapInstance.addLayer({
        id: 'bounds-layer',
        type: 'fill',
        source: 'bounds',
        layout: {},
        paint: {
          'fill-color': '#00ff00',
          'fill-opacity': 0.2,
        },
      });
    }
    const areaSqDegrees = Math.abs((bounds[1][0] - bounds[0][0]) * (bounds[1][1] - bounds[0][1]));
    let areaSqKm = (areaSqDegrees * 111.32 * 111.32).toFixed(2);
    const perc = areaSqDegrees > 0 ? ((areaSqDegrees / 360)).toFixed(2) : 0; // todo fix formula
    areaSqKm = areaSqKm.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setBoundsInfo({
      maxEast: bounds[1][0],
      maxWest: bounds[0][0],
      maxNorth: bounds[1][1],
      maxSouth: bounds[0][1],
      area: areaSqKm,
      percOfTotal: perc,
    });

    // Adjust the map view to fit the bounds
    const mapBounds = [
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]],
    ];
    mapInstance.fitBounds(mapBounds, { padding: 50 });
  };

  const handleConfirm = async () => {
    let updatedPoints;

    if (currentAction === 'add' && selectedPoint) {
      updatedPoints = [...points, selectedPoint];
    } else if (currentAction === 'delete' && selectedPoint !== null) {
      updatedPoints = points.filter((_, index) => index !== selectedPoint);
    }
    
    if (updatedPoints) {
      setPoints(updatedPoints);
      if (map) {
        updateMapData(map, updatedPoints); // Ensure map is initialized
      }
      await updatePointsDataOnServer(updatedPoints, username);
    }

    setModalIsOpen(false);
  };

  const handleLogout = () => {
    // Clear username and reload the page
    localStorage.removeItem('username');
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}>
        <div><strong>Max East:</strong> {boundsInfo.maxEast} (Point {boundaryPoints.maxEast})</div>
        <div><strong>Max West:</strong> {boundsInfo.maxWest} (Point {boundaryPoints.maxWest})</div>
        <div><strong>Max North:</strong> {boundsInfo.maxNorth} (Point {boundaryPoints.maxNorth})</div>
        <div><strong>Max South:</strong> {boundsInfo.maxSouth} (Point {boundaryPoints.maxSouth})</div>
        <div><strong>Area:</strong> {boundsInfo.area} km^2 ({boundsInfo.percOfTotal}%)</div>
      </div>
      <div 
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          cursor: 'pointer',
          fontSize: '24px',
          color: 'red'
        }}
        onClick={handleLogout}
      >
        &#10005; {/* Cross icon for logout */}
      </div>
      <CustomModal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        onConfirm={handleConfirm}
        message={`Do you want to ${currentAction === 'add' ? 'add a point here?' : 'delete point ' + selectedPoint + '?'}`}
      />
    </div>
  );
};

export default MapboxGlobe;
