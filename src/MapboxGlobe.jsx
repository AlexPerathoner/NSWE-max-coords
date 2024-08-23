// src/MapboxGlobe.jsx
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

  useEffect(() => {
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
        fetchPointsData('user1'); // Load points data on map load // todo doesnt work 
        
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

  const fetchPointsData = async (user) => {
    try {
      const response = await fetch('http://localhost:5002/api/points?user=' + user);
      const data = await response.json();
      console.log(data, map)
      setPoints(data || []);
      updateMapData(map, data || []); // map is null

    } catch (error) {
      console.error('Error fetching points data:', error);
    }
  };

  const updatePointsDataOnServer = async (updatedPoints, user) => {
    try {
      await fetch('http://localhost:5002/api/points?user=' + user, {
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
    if (!Array.isArray(updatedPoints)) {
      console.error('updatedPoints is not an array:', updatedPoints);
      return;
    }

    // Calculate bounds if points exist, otherwise use a default bound
    let bounds;
    if (updatedPoints.length > 0) {
      const lats = updatedPoints.map(point => point[1]);
      const lngs = updatedPoints.map(point => point[0]);
      bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
    } else {
      // Use a default bounding box if no points exist
      bounds = [ // todo should be current user location
        [0, 0],
        [0, 0],
      ];
    }

    console.log('Bounds:', bounds);

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
      updateMapData(map, updatedPoints);
      await updatePointsDataOnServer(updatedPoints, 'user1');
    }

    setModalIsOpen(false);
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
      <CustomModal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        onConfirm={handleConfirm}
        message={`Do you want to ${currentAction === 'add' ? 'add' : 'delete'} this point?`}
      />
    </div>
  );
};

export default MapboxGlobe;
