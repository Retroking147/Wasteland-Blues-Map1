import { cn } from "@/lib/utils";
import type { LocationWithVendors } from "@shared/schema";
import { getLocationIcon, getLocationColor } from "@/lib/map-utils";
import { 
  Home, 
  Skull, 
  Landmark, 
  Store, 
  Shield, 
  MapPin,
  Crosshair 
} from "lucide-react";

interface LocationMarkerProps {
  location: LocationWithVendors;
  isSelected?: boolean;
  isRoadStart?: boolean;
  isDrawingRoad?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const iconMap = {
  'home': Home,
  'skull-crossbones': Skull,
  'landmark': Landmark,
  'store': Store,
  'shield': Shield,
  'map-pin': MapPin,
};

export default function LocationMarker({
  location,
  isSelected = false,
  isRoadStart = false,
  isDrawingRoad = false,
  onClick
}: LocationMarkerProps) {
  const iconName = getLocationIcon(location.type);
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || MapPin;
  const color = getLocationColor(location.type);
  
  const markerSize = location.type === 'settlement' && location.name.includes('Vegas') ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = location.type === 'settlement' && location.name.includes('Vegas') ? 'text-sm' : 'text-xs';

  return (
    <div
      className="location-marker absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ 
        left: `${location.x}%`, 
        top: `${location.y}%` 
      }}
      onClick={onClick}
      data-testid={`location-marker-${location.id}`}
    >
      {/* Marker icon */}
      <div 
        className={cn(
          "rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg transition-all duration-200",
          markerSize,
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isRoadStart && "ring-2 ring-accent ring-offset-2 ring-offset-background",
          isDrawingRoad && !isRoadStart && "ring-2 ring-dashed ring-muted-foreground ring-offset-2 ring-offset-background"
        )}
        style={{
          backgroundColor: color,
          borderColor: 'var(--background)',
          color: 'var(--background)'
        }}
      >
        <IconComponent size={12} />
      </div>

      {/* Location name */}
      <div 
        className={cn(
          "font-bold mt-1 whitespace-nowrap terminal-glow pointer-events-none",
          textSize
        )}
        style={{ color }}
      >
        {location.name}
      </div>

      {/* Road start indicator */}
      {isRoadStart && (
        <div className="absolute -top-1 -right-1">
          <Crosshair 
            size={14} 
            className="text-accent animate-pulse" 
          />
        </div>
      )}

      {/* Safety indicator for dangerous locations */}
      {(location.safetyRating || 3) <= 2 && (
        <div className="absolute -top-1 -left-1">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse border border-background"></div>
        </div>
      )}
    </div>
  );
}
