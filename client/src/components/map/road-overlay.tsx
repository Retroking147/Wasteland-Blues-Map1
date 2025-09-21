import type { Road, LocationWithVendors } from "@shared/schema";

interface RoadOverlayProps {
  roads: Road[];
  locations: LocationWithVendors[];
}

export default function RoadOverlay({ roads, locations }: RoadOverlayProps) {
  const getLocationById = (id: string) => {
    return locations.find(loc => loc.id === id);
  };

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full">
      {roads.map((road) => {
        const fromLocation = getLocationById(road.fromLocationId);
        const toLocation = getLocationById(road.toLocationId);
        
        if (!fromLocation || !toLocation) return null;

        // Generate path from location coordinates using pixel values instead of percentages
        const pathData = road.pathData || `M ${fromLocation.x} ${fromLocation.y} L ${toLocation.x} ${toLocation.y}`;

        return (
          <path
            key={road.id}
            d={pathData}
            stroke="rgba(245, 158, 11, 0.6)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="10,5"
            className="transition-opacity duration-200"
            data-testid={`road-${road.id}`}
          />
        );
      })}
    </svg>
  );
}
