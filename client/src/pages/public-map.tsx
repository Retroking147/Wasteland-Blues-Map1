import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import MapCanvas from "@/components/map/map-canvas";
import MapControls from "@/components/ui/map-controls";
import LocationInfoModal from "@/components/modals/location-info-modal";
import { useMapState } from "@/hooks/use-map-state";
import type { MapData, LocationWithVendors } from "@shared/schema";
import { Radiation, Shield, Filter, Map } from "lucide-react";

export default function PublicMap() {
  const [selectedLocation, setSelectedLocation] = useState<LocationWithVendors | null>(null);
  
  const {
    mapState,
    updateZoom,
    centerMap,
    selectLocation,
    toggleFilter,
    filteredLocations,
  } = useMapState();

  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ["/api/map/public"],
    refetchInterval: 30000, // Refresh every 30 seconds to get updates
  });

  const handleLocationClick = (locationId: string) => {
    const location = mapData?.locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      selectLocation(locationId);
    }
  };

  const handleCloseLocationInfo = () => {
    setSelectedLocation(null);
    selectLocation(null);
  };

  const displayedLocations = mapData ? filteredLocations(mapData.locations) : [];
  const locationCounts = mapData ? {
    settlements: mapData.locations.filter(l => l.type === 'settlement').length,
    dungeons: mapData.locations.filter(l => l.type === 'dungeon').length,
    traders: mapData.locations.filter(l => l.type === 'trader').length,
    landmarks: mapData.locations.filter(l => l.type === 'landmark').length,
  } : { settlements: 0, dungeons: 0, traders: 0, landmarks: 0 };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Radiation className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
          <div className="text-primary terminal-glow">LOADING MAP DATA...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pip-boy-border bg-card/50 backdrop-blur-sm border-b-0 rounded-none p-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Radiation className="text-accent text-2xl terminal-glow" />
            <div>
              <h1 className="text-2xl font-bold text-primary terminal-glow font-mono">
                NEW VEGAS TERRITORY MAP
              </h1>
              <p className="text-muted-foreground text-sm">Interactive Wasteland Navigator v2.281</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant="ghost"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
                data-testid="public-mode-active"
              >
                PUBLIC MAP
              </Button>
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="px-4 py-2 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium"
                  data-testid="admin-mode-link"
                >
                  ADMIN ACCESS
                </Button>
              </Link>
            </div>
            
            <div className="text-right text-sm">
              <div className="text-accent terminal-glow">SYSTEM: ONLINE</div>
              <div className="text-muted-foreground">
                Last Sync: {mapData?.lastPublishedAt 
                  ? new Date(mapData.lastPublishedAt).toLocaleTimeString() 
                  : "Never"
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 wasteland-card border-r border-border p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Navigation Controls */}
            <Card className="pip-boy-border p-4">
              <h2 className="text-lg font-bold text-primary mb-4 terminal-glow flex items-center gap-2">
                <Map className="h-5 w-5" />
                NAVIGATION
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom Level</span>
                  <span className="text-accent font-mono">{mapState.zoomLevel}%</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    onClick={() => updateZoom(25)}
                    data-testid="zoom-in-sidebar"
                  >
                    ZOOM IN
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    onClick={() => updateZoom(-25)}
                    data-testid="zoom-out-sidebar"
                  >
                    ZOOM OUT
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={centerMap}
                  data-testid="center-map-sidebar"
                >
                  CENTER MAP
                </Button>
              </div>
            </Card>

            {/* Location Filters */}
            <Card className="pip-boy-border p-4">
              <h2 className="text-lg font-bold text-primary mb-4 terminal-glow flex items-center gap-2">
                <Filter className="h-5 w-5" />
                LOCATION FILTER
              </h2>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={mapState.filters.settlements}
                    onCheckedChange={() => toggleFilter('settlements')}
                    data-testid="filter-settlements"
                  />
                  <span className="text-sm">Settlements</span>
                  <span className="text-xs text-muted-foreground ml-auto">({locationCounts.settlements})</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={mapState.filters.dungeons}
                    onCheckedChange={() => toggleFilter('dungeons')}
                    data-testid="filter-dungeons"
                  />
                  <span className="text-sm">Dungeons</span>
                  <span className="text-xs text-muted-foreground ml-auto">({locationCounts.dungeons})</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={mapState.filters.traders}
                    onCheckedChange={() => toggleFilter('traders')}
                    data-testid="filter-traders"
                  />
                  <span className="text-sm">Traders</span>
                  <span className="text-xs text-muted-foreground ml-auto">({locationCounts.traders})</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={mapState.filters.landmarks}
                    onCheckedChange={() => toggleFilter('landmarks')}
                    data-testid="filter-landmarks"
                  />
                  <span className="text-sm">Landmarks</span>
                  <span className="text-xs text-muted-foreground ml-auto">({locationCounts.landmarks})</span>
                </label>
              </div>
            </Card>

            {/* System Info */}
            <Card className="pip-boy-border p-4">
              <h2 className="text-lg font-bold text-primary mb-4 terminal-glow flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SYSTEM STATUS
              </h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Map Version:</span>
                  <span className="text-accent">2.281-PUBLIC</span>
                </div>
                <div className="flex justify-between">
                  <span>Locations:</span>
                  <span className="text-primary">{mapData?.locations.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trade Routes:</span>
                  <span className="text-primary">{mapData?.roads.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Level:</span>
                  <span className="text-accent">PUBLIC</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <MapCanvas
            locations={displayedLocations}
            roads={mapData?.roads || []}
            zoomLevel={mapState.zoomLevel}
            centerX={mapState.centerX}
            centerY={mapState.centerY}
            onLocationClick={handleLocationClick}
            selectedLocationId={mapState.selectedLocationId}
          />

          <MapControls
            onZoomIn={() => updateZoom(25)}
            onZoomOut={() => updateZoom(-25)}
            onCenter={centerMap}
            zoomLevel={mapState.zoomLevel}
          />
        </div>
      </div>

      {/* Location Info Modal */}
      <LocationInfoModal
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={handleCloseLocationInfo}
      />
    </div>
  );
}
