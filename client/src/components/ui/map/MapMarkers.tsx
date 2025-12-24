// import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { type MapLocation, useMapMarkers } from './hooks/useMapMarkers';

interface MapMarkersProps {
  locations: MapLocation[];
}

export function MapMarkers({ locations }: MapMarkersProps) {
  const { clientMarkers, facilityMarkers, isLoading } = useMapMarkers(locations);

  if (isLoading) {
    return null; // Markers will appear progressively as they load
  }

  return (
    <>
      {/* Client Location Markers */}
      {clientMarkers.map(({ location, icon }) => (
        <Marker
          key={`client-${location.id}`}
          position={[location.latitude, location.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-blue-600">Client: {location.name}</h3>
              <p className="text-sm text-gray-600">{location.city}, {location.country}</p>
              {location.details && <p className="text-sm mt-1">{location.details}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Facility Location Markers */}
      {facilityMarkers.map(({ location, icon }) => (
        <Marker
          key={`facility-${location.id}`}
          position={[location.latitude, location.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-green-600">Facility: {location.name}</h3>
              <p className="text-sm text-gray-600">{location.city}, {location.country}</p>
              {location.details && <p className="text-sm mt-1">{location.details}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}