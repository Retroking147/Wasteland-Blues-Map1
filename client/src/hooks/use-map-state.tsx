import { useState, useCallback } from "react";
import type { LocationWithVendors } from "@shared/schema";

export interface MapState {
  zoomLevel: number;
  centerX: number;
  centerY: number;
  selectedLocationId: string | null;
  filters: {
    settlements: boolean;
    dungeons: boolean;
    landmarks: boolean;
    traders: boolean;
  };
  isDrawingRoad: boolean;
  roadStartLocation: string | null;
}

export function useMapState() {
  const [mapState, setMapState] = useState<MapState>({
    zoomLevel: 75,
    centerX: 50,
    centerY: 50,
    selectedLocationId: null,
    filters: {
      settlements: true,
      dungeons: true,
      landmarks: true,
      traders: true,
    },
    isDrawingRoad: false,
    roadStartLocation: null,
  });

  const updateZoom = useCallback((delta: number) => {
    setMapState(prev => ({
      ...prev,
      zoomLevel: Math.max(25, Math.min(200, prev.zoomLevel + delta))
    }));
  }, []);

  const centerMap = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      centerX: 50,
      centerY: 50,
      zoomLevel: 75
    }));
  }, []);

  const selectLocation = useCallback((locationId: string | null) => {
    setMapState(prev => ({
      ...prev,
      selectedLocationId: locationId
    }));
  }, []);

  const toggleFilter = useCallback((filterType: keyof MapState['filters']) => {
    setMapState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: !prev.filters[filterType]
      }
    }));
  }, []);

  const startDrawingRoad = useCallback((startLocationId: string) => {
    setMapState(prev => ({
      ...prev,
      isDrawingRoad: true,
      roadStartLocation: startLocationId
    }));
  }, []);

  const stopDrawingRoad = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      isDrawingRoad: false,
      roadStartLocation: null
    }));
  }, []);

  const filteredLocations = useCallback((locations: LocationWithVendors[]) => {
    return locations.filter(location => {
      const { type } = location;
      if (type === 'settlement' && !mapState.filters.settlements) return false;
      if (type === 'dungeon' && !mapState.filters.dungeons) return false;
      if (type === 'landmark' && !mapState.filters.landmarks) return false;
      if (type === 'trader' && !mapState.filters.traders) return false;
      return true;
    });
  }, [mapState.filters]);

  return {
    mapState,
    updateZoom,
    centerMap,
    selectLocation,
    toggleFilter,
    startDrawingRoad,
    stopDrawingRoad,
    filteredLocations,
  };
}
