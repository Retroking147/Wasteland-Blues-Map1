import { useRef, useState, useCallback } from "react";
import type { LocationWithVendors, Road } from "@shared/schema";
import LocationMarker from "./location-marker";
import RoadOverlay from "./road-overlay";
import { convertScreenToMapCoordinates, isValidLocationPlacement } from "@/lib/map-utils";
import { cn } from "@/lib/utils";

interface MapCanvasProps {
  locations: LocationWithVendors[];
  roads: Road[];
  zoomLevel: number;
  centerX: number;
  centerY: number;
  onLocationClick: (locationId: string) => void;
  onLocationSelect?: (locationId: string) => void;
  onMapClick?: (coordinates: { x: number; y: number }) => void;
  isAdminMode?: boolean;
  selectedLocationId?: string | null;
  isDrawingRoad?: boolean;
  roadStartLocation?: string | null;
  className?: string;
}

export default function MapCanvas({
  locations,
  roads,
  zoomLevel,
  centerX,
  centerY,
  onLocationClick,
  onLocationSelect,
  onMapClick,
  isAdminMode = false,
  selectedLocationId,
  isDrawingRoad = false,
  roadStartLocation,
  className
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const coordinates = convertScreenToMapCoordinates(
      e.clientX,
      e.clientY,
      rect,
      zoomLevel,
      centerX,
      centerY
    );
    
    setMousePosition({ x: Math.round(coordinates.x), y: Math.round(coordinates.y) });
  }, [zoomLevel, centerX, centerY]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !isAdminMode || !onMapClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const coordinates = convertScreenToMapCoordinates(
      e.clientX,
      e.clientY,
      rect,
      zoomLevel,
      centerX,
      centerY
    );

    // Only allow placement if it's far enough from existing locations
    if (isValidLocationPlacement(coordinates, locations)) {
      onMapClick(coordinates);
    }
  }, [isAdminMode, onMapClick, zoomLevel, centerX, centerY, locations]);

  const handleLocationClick = useCallback((locationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDrawingRoad && roadStartLocation && roadStartLocation !== locationId) {
      onLocationSelect?.(locationId);
    } else {
      onLocationClick(locationId);
    }
  }, [isDrawingRoad, roadStartLocation, onLocationClick, onLocationSelect]);

  const transform = `scale(${zoomLevel / 100}) translate(${(50 - centerX)}%, ${(50 - centerY)}%)`;

  return (
    <div
      ref={canvasRef}
      className={cn(
        "map-canvas w-full h-full relative overflow-hidden",
        isAdminMode ? "cursor-crosshair" : "cursor-default",
        className
      )}
      onMouseMove={handleMouseMove}
      onClick={handleMapClick}
      data-testid="map-canvas"
    >
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform
        }}
      />

      {/* Map content container */}
      <div
        className="absolute inset-0"
        style={{ transform }}
      >
        {/* Roads */}
        <RoadOverlay roads={roads} locations={locations} />

        {/* Location markers */}
        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            isSelected={selectedLocationId === location.id}
            isRoadStart={roadStartLocation === location.id}
            isDrawingRoad={isDrawingRoad}
            onClick={(e) => handleLocationClick(location.id, e)}
          />
        ))}
      </div>

      {/* Coordinate display */}
      <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded p-2 text-xs font-mono">
        <div className="text-muted-foreground">COORDINATES</div>
        <div className="text-primary" data-testid="coordinates-display">
          X: {mousePosition.x}, Y: {mousePosition.y}
        </div>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded p-2 text-xs">
        <div className="text-muted-foreground mb-1">SCALE</div>
        <div className="flex items-center space-x-2">
          <div className="w-12 h-1 bg-primary"></div>
          <span className="text-primary">5 km</span>
        </div>
      </div>

      {/* Admin mode indicator */}
      {isAdminMode && (
        <div className="absolute top-4 right-4 bg-primary/20 border border-primary rounded p-2 text-xs text-primary font-bold">
          ADMIN MODE ACTIVE
        </div>
      )}
    </div>
  );
}
