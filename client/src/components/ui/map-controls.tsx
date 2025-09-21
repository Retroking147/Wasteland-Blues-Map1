import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Target } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  zoomLevel: number;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  zoomLevel
}: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        disabled={zoomLevel >= 200}
        className="bg-card/80 backdrop-blur-sm border-border hover:bg-card"
        data-testid="zoom-in-button"
      >
        <ZoomIn className="h-4 w-4 text-primary" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        disabled={zoomLevel <= 25}
        className="bg-card/80 backdrop-blur-sm border-border hover:bg-card"
        data-testid="zoom-out-button"
      >
        <ZoomOut className="h-4 w-4 text-primary" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onCenter}
        className="bg-card/80 backdrop-blur-sm border-border hover:bg-card"
        data-testid="center-map-button"
      >
        <Target className="h-4 w-4 text-accent" />
      </Button>

      <div className="bg-card/80 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs font-mono text-center">
        <div className="text-muted-foreground">ZOOM</div>
        <div className="text-primary">{zoomLevel}%</div>
      </div>
    </div>
  );
}
