import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LocationWithVendors } from "@shared/schema";
import { getSafetyRatingColor, getSafetyRatingText } from "@/lib/map-utils";
import { 
  Info, 
  Store, 
  AlertTriangle, 
  MapPin, 
  Star,
  Clock,
  X
} from "lucide-react";

interface LocationInfoModalProps {
  location: LocationWithVendors | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationInfoModal({
  location,
  isOpen,
  onClose
}: LocationInfoModalProps) {
  if (!location) return null;

  const safetyRating = location.safetyRating || 3;
  const safetyColor = getSafetyRatingColor(safetyRating);
  const safetyText = getSafetyRatingText(safetyRating);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="pip-boy-border bg-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-primary terminal-glow">
                {location.name}
              </DialogTitle>
              <div className="text-sm text-muted-foreground capitalize">
                {location.type} - {location.type === 'settlement' ? 'Safe Zone' : 'Exploration Area'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="close-location-info"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {location.description && (
            <div className="pip-boy-border p-4">
              <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                DESCRIPTION
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {location.description}
              </p>
            </div>
          )}

          {/* Vendors & Traders */}
          {location.vendors.length > 0 && (
            <div className="pip-boy-border p-4">
              <h3 className="font-bold text-accent mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                VENDORS & TRADERS
              </h3>

              <div className="space-y-3">
                {location.vendors.map((vendor) => (
                  <div key={vendor.id} className="bg-muted/50 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-primary">{vendor.name}</div>
                      {vendor.hours && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {vendor.hours}
                        </div>
                      )}
                    </div>
                    
                    {vendor.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {vendor.description}
                      </div>
                    )}
                    
                    {vendor.services && vendor.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vendor.services.map((service, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs bg-accent/20 text-accent"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Rating */}
          <div className="pip-boy-border p-4">
            <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              SAFETY RATING
            </h3>
            
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < safetyRating 
                        ? 'text-accent fill-current' 
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: safetyColor }}
              >
                {safetyText}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {safetyRating >= 4 && "Well-protected area with regular patrols and emergency services."}
              {safetyRating === 3 && "Moderately safe. Basic security measures in place."}
              {safetyRating === 2 && "Dangerous area. Hostile creatures and raiders present."}
              {safetyRating === 1 && "Extremely dangerous. High radiation or hostile entities."}
            </p>
          </div>

          {/* Location Coordinates */}
          <div className="pip-boy-border p-4">
            <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              COORDINATES
            </h3>
            <div className="text-sm font-mono text-primary">
              X: {location.x.toFixed(1)}, Y: {location.y.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
            onClick={onClose}
            data-testid="close-location-modal"
          >
            <MapPin className="h-4 w-4 mr-2" />
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
