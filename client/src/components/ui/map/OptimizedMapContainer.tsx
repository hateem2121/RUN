// import React from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Map, Satellite } from 'lucide-react';
import { MapMarkers } from './MapMarkers';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { useMapState } from './hooks/useMapState';
import type { MapLocation } from './hooks/useMapMarkers';
import "leaflet/dist/leaflet.css";

interface OptimizedMapContainerProps {
  locations: MapLocation[];
  className?: string;
}

export function OptimizedMapContainer({ locations, className = '' }: OptimizedMapContainerProps) {
  const { activeLayer, toggleLayer, mapConfig, tileLayerConfig } = useMapState();

  const clientLocations = locations.filter(l => l.type === 'client' && l.isActive);
  const facilityLocations = locations.filter(l => l.type === 'facility' && l.isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`bg-background rounded-3xl p-8 shadow-lg ${className}`}
    >
      <div className="h-[500px] w-full rounded-2xl overflow-hidden relative">
        {/* Map Layer Toggle Button */}
        <motion.div
          className="absolute top-4 right-4 z-[1001]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={toggleLayer}
            className="bg-background/90 border border-border/50 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeLayer === 'roadmap' ? (
              <>
                <Satellite className="h-4 w-4" />
                Satellite
              </>
            ) : (
              <>
                <Map className="h-4 w-4" />
                Roadmap
              </>
            )}
          </motion.button>
        </motion.div>

        <MapErrorBoundary>
          <MapContainer
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={mapConfig.zoomControl}
            scrollWheelZoom={mapConfig.scrollWheelZoom}
          >
            {/* Dynamic Tile Layer */}
            <TileLayer
              key={activeLayer}
              attribution={tileLayerConfig.attribution}
              url={tileLayerConfig.url}
            />

            {/* Optimized Markers */}
            <MapMarkers locations={locations} />
          </MapContainer>
        </MapErrorBoundary>
      </div>

      {/* Map Legend */}
      <div className="flex justify-center items-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-muted-foreground">
            Client Locations ({clientLocations.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-sm text-muted-foreground">
            Manufacturing Facilities ({facilityLocations.length})
          </span>
        </div>
      </div>
    </motion.div>
  );
}