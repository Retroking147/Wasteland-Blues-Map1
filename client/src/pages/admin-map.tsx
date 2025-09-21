import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import MapCanvas from "@/components/map/map-canvas";
import MapControls from "@/components/ui/map-controls";
import LocationInfoModal from "@/components/modals/location-info-modal";
import LocationEditorModal from "@/components/modals/location-editor-modal";
import AdminAuthModal from "@/components/modals/admin-auth-modal";
import { useMapState } from "@/hooks/use-map-state";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MapData, LocationWithVendors } from "@shared/schema";
import { 
  Radiation, 
  Shield, 
  Filter, 
  Map, 
  Plus, 
  Upload, 
  Edit,
  Route,
  ShieldQuestion
} from "lucide-react";

export default function AdminMap() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithVendors | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationWithVendors | null>(null);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<{ x: number; y: number } | undefined>();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    mapState,
    updateZoom,
    centerMap,
    selectLocation,
    toggleFilter,
    filteredLocations,
    startDrawingRoad,
    stopDrawingRoad,
  } = useMapState();

  // Show auth modal on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ["/api/map/admin"],
    enabled: isAuthenticated,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/publish", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map"] });
      toast({
        title: "Changes Published",
        description: "All changes have been pushed to the public map",
      });
    },
    onError: () => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish changes to public map",
        variant: "destructive",
      });
    },
  });

  const createRoadMutation = useMutation({
    mutationFn: async ({ fromLocationId, toLocationId }: { fromLocationId: string, toLocationId: string }) => {
      const response = await apiRequest("POST", "/api/roads", {
        fromLocationId,
        toLocationId,
        pathData: "", // Will be calculated by backend
        isPublished: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map"] });
      stopDrawingRoad();
      toast({
        title: "Road Created",
        description: "New trade route has been established",
      });
    },
    onError: () => {
      toast({
        title: "Road Creation Failed",
        description: "Failed to create road between locations",
        variant: "destructive",
      });
    },
  });

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLocationClick = (locationId: string) => {
    if (mapState.isDrawingRoad && mapState.roadStartLocation && mapState.roadStartLocation !== locationId) {
      // Complete road creation
      createRoadMutation.mutate({
        fromLocationId: mapState.roadStartLocation,
        toLocationId: locationId,
      });
      return;
    }

    const location = mapData?.locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      selectLocation(locationId);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    if (mapState.isDrawingRoad && mapState.roadStartLocation) {
      createRoadMutation.mutate({
        fromLocationId: mapState.roadStartLocation,
        toLocationId: locationId,
      });
    }
  };

  const handleMapClick = (coordinates: { x: number; y: number }) => {
    setNewLocationCoords(coordinates);
    setIsCreatingLocation(true);
  };

  const handleEditLocation = () => {
    if (selectedLocation) {
      setEditingLocation(selectedLocation);
      setSelectedLocation(null);
    }
  };

  const handleStartRoadDrawing = () => {
    if (selectedLocation) {
      startDrawingRoad(selectedLocation.id);
      setSelectedLocation(null);
    }
  };

  const displayedLocations = mapData ? filteredLocations(mapData.locations) : [];
  const locationCounts = mapData ? {
    settlements: mapData.locations.filter(l => l.type === 'settlement').length,
    dungeons: mapData.locations.filter(l => l.type === 'dungeon').length,
    traders: mapData.locations.filter(l => l.type === 'trader').length,
    landmarks: mapData.locations.filter(l => l.type === 'landmark').length,
  } : { settlements: 0, dungeons: 0, traders: 0, landmarks: 0 };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AdminAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
        <div className="text-center">
          <ShieldQuestion className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary terminal-glow mb-2">
            ADMIN ACCESS REQUIRED
          </h1>
          <p className="text-muted-foreground mb-4">
            Please authenticate to access the administration panel
          </p>
          <Button
            onClick={() => setShowAuthModal(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/80"
          >
            AUTHENTICATE
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Radiation className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
          <div className="text-primary terminal-glow">LOADING ADMIN MAP DATA...</div>
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
              <p className="text-muted-foreground text-sm">Administrative Control Panel v2.281</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-muted rounded-lg p-1">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="px-4 py-2 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium"
                  data-testid="public-mode-link"
                >
                  PUBLIC MAP
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
                data-testid="admin-mode-active"
              >
                ADMIN ACCESS
              </Button>
            </div>
            
            <div className="text-right text-sm">
              <div className="text-destructive terminal-glow">ADMIN: ACTIVE</div>
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
            {/* Admin Controls */}
            <Card className="pip-boy-border p-4 admin-panel">
              <h2 className="text-lg font-bold text-primary mb-4 terminal-glow flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ADMIN CONTROLS
              </h2>
              
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 pulse-animation"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  data-testid="publish-changes-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {publishMutation.isPending ? "PUBLISHING..." : "PUSH UPDATE TO PUBLIC"}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/80"
                    onClick={() => setIsCreatingLocation(true)}
                    data-testid="add-poi-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    ADD POI
                  </Button>
                  <Button
                    size="sm"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    onClick={handleStartRoadDrawing}
                    disabled={!selectedLocation || mapState.isDrawingRoad}
                    data-testid="add-road-button"
                  >
                    <Route className="h-4 w-4 mr-1" />
                    ADD ROAD
                  </Button>
                </div>
              </div>
            </Card>

            {/* Location Editor Info */}
            {selectedLocation && (
              <Card className="pip-boy-border p-4">
                <h2 className="text-lg font-bold text-primary mb-4 terminal-glow flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  SELECTED LOCATION
                </h2>
                
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-accent">{selectedLocation.name}</div>
                  <div className="text-muted-foreground capitalize">{selectedLocation.type}</div>
                  <div className="text-xs text-muted-foreground">
                    Coordinates: {selectedLocation.x.toFixed(1)}, {selectedLocation.y.toFixed(1)}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditLocation}
                    data-testid="edit-selected-location"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    EDIT
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartRoadDrawing}
                    disabled={mapState.isDrawingRoad}
                    data-testid="start-road-from-selected"
                  >
                    <Route className="h-3 w-3 mr-1" />
                    ROAD
                  </Button>
                </div>
              </Card>
            )}

            {/* Road Drawing Status */}
            {mapState.isDrawingRoad && (
              <Card className="pip-boy-border p-4 bg-accent/10">
                <h2 className="text-lg font-bold text-accent mb-2 terminal-glow">
                  ROAD CREATION MODE
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Click on a destination location to create a trade route.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopDrawingRoad}
                  data-testid="cancel-road-drawing"
                >
                  CANCEL
                </Button>
              </Card>
            )}

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
            onLocationSelect={handleLocationSelect}
            onMapClick={handleMapClick}
            isAdminMode={true}
            selectedLocationId={mapState.selectedLocationId}
            isDrawingRoad={mapState.isDrawingRoad}
            roadStartLocation={mapState.roadStartLocation}
          />

          <MapControls
            onZoomIn={() => updateZoom(25)}
            onZoomOut={() => updateZoom(-25)}
            onCenter={centerMap}
            zoomLevel={mapState.zoomLevel}
          />
        </div>
      </div>

      {/* Modals */}
      <LocationInfoModal
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={() => {
          setSelectedLocation(null);
          selectLocation(null);
        }}
      />

      <LocationEditorModal
        location={editingLocation}
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
      />

      <LocationEditorModal
        location={null}
        initialCoordinates={newLocationCoords}
        isOpen={isCreatingLocation}
        onClose={() => {
          setIsCreatingLocation(false);
          setNewLocationCoords(undefined);
        }}
      />
    </div>
  );
}
