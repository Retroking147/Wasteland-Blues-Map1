import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LocationWithVendors, InsertVendor } from "@shared/schema";
import { Edit, Save, Trash2, Plus, X } from "lucide-react";

interface LocationEditorModalProps {
  location: LocationWithVendors | null;
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { x: number; y: number };
}

interface VendorForm extends Omit<InsertVendor, 'locationId'> {
  services: string[];
}

export default function LocationEditorModal({
  location,
  isOpen,
  onClose,
  initialCoordinates
}: LocationEditorModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "settlement",
    description: "",
    x: 50,
    y: 50,
    safetyRating: 3,
  });

  const [vendors, setVendors] = useState<VendorForm[]>([]);
  const [newService, setNewService] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!location;

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        description: location.description || "",
        x: location.x,
        y: location.y,
        safetyRating: location.safetyRating || 3,
      });
      setVendors(location.vendors.map(v => ({
        ...v,
        services: Array.isArray(v.services) ? v.services : []
      })));
    } else if (initialCoordinates) {
      setFormData(prev => ({
        ...prev,
        x: initialCoordinates.x,
        y: initialCoordinates.y,
      }));
    }
  }, [location, initialCoordinates]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? `/api/locations/${location.id}` : "/api/locations";
      const method = isEdit ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map"] });
      toast({
        title: isEdit ? "Location Updated" : "Location Created",
        description: `${formData.name} has been ${isEdit ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} location`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!location) throw new Error("No location to delete");
      await apiRequest("DELETE", `/api/locations/${location.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map"] });
      toast({
        title: "Location Deleted",
        description: `${location?.name} has been deleted successfully`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      vendors: vendors.map((vendor) => {
        const { id, ...vendorWithoutId } = vendor as any;
        return vendorWithoutId;
      })
    };
    
    saveMutation.mutate(submitData);
  };

  const addVendor = () => {
    setVendors([...vendors, {
      name: "",
      description: "",
      hours: "Unknown",
      services: []
    }]);
  };

  const updateVendor = (index: number, field: string, value: any) => {
    const updated = [...vendors];
    updated[index] = { ...updated[index], [field]: value };
    setVendors(updated);
  };

  const removeVendor = (index: number) => {
    setVendors(vendors.filter((_, i) => i !== index));
  };

  const addServiceToVendor = (vendorIndex: number) => {
    if (newService.trim()) {
      const updated = [...vendors];
      updated[vendorIndex].services = [...updated[vendorIndex].services, newService.trim()];
      setVendors(updated);
      setNewService("");
    }
  };

  const removeServiceFromVendor = (vendorIndex: number, serviceIndex: number) => {
    const updated = [...vendors];
    updated[vendorIndex].services = updated[vendorIndex].services.filter((_, i) => i !== serviceIndex);
    setVendors(updated);
  };

  const handleClose = () => {
    setFormData({
      name: "",
      type: "settlement",
      description: "",
      x: 50,
      y: 50,
      safetyRating: 3,
    });
    setVendors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="pip-boy-border bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary terminal-glow flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {isEdit ? "EDIT LOCATION" : "NEW LOCATION"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="pip-boy-border p-4 space-y-3">
            <h3 className="font-bold text-accent">BASIC INFORMATION</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground">LOCATION NAME</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter location name..."
                  required
                  data-testid="location-name-input"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">TYPE</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger data-testid="location-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="settlement">Settlement</SelectItem>
                    <SelectItem value="dungeon">Dungeon</SelectItem>
                    <SelectItem value="landmark">Landmark</SelectItem>
                    <SelectItem value="trader">Trader Post</SelectItem>
                    <SelectItem value="faction">Faction Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground">X COORDINATE</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.x}
                  onChange={(e) => setFormData({...formData, x: parseFloat(e.target.value)})}
                  data-testid="location-x-input"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Y COORDINATE</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.y}
                  onChange={(e) => setFormData({...formData, y: parseFloat(e.target.value)})}
                  data-testid="location-y-input"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">SAFETY RATING</Label>
                <Select value={formData.safetyRating.toString()} onValueChange={(value) => setFormData({...formData, safetyRating: parseInt(value)})}>
                  <SelectTrigger data-testid="safety-rating-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Extremely Dangerous</SelectItem>
                    <SelectItem value="2">2 - Dangerous</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Safe</SelectItem>
                    <SelectItem value="5">5 - Very Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">DESCRIPTION</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Location description..."
                className="h-20 resize-none"
                data-testid="location-description-input"
              />
            </div>
          </div>

          {/* Vendors */}
          <div className="pip-boy-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-accent">VENDORS & TRADERS</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVendor}
                data-testid="add-vendor-button"
              >
                <Plus className="h-4 w-4 mr-1" />
                ADD VENDOR
              </Button>
            </div>

            {vendors.map((vendor, index) => (
              <div key={index} className="bg-muted/50 p-3 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Vendor #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVendor(index)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`remove-vendor-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Vendor name"
                    value={vendor.name}
                    onChange={(e) => updateVendor(index, 'name', e.target.value)}
                    data-testid={`vendor-name-${index}`}
                  />
                  <Input
                    placeholder="Hours (e.g. 9 AM - 5 PM)"
                    value={vendor.hours || ''}
                    onChange={(e) => updateVendor(index, 'hours', e.target.value)}
                    data-testid={`vendor-hours-${index}`}
                  />
                </div>

                <Textarea
                  placeholder="Vendor description"
                  value={vendor.description || ''}
                  onChange={(e) => updateVendor(index, 'description', e.target.value)}
                  className="h-16 resize-none"
                  data-testid={`vendor-description-${index}`}
                />

                <div>
                  <Label className="text-xs text-muted-foreground">SERVICES</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {vendor.services.map((service, serviceIndex) => (
                      <Badge
                        key={serviceIndex}
                        variant="secondary"
                        className="text-xs bg-accent/20 text-accent cursor-pointer"
                        onClick={() => removeServiceFromVendor(index, serviceIndex)}
                      >
                        {service} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add service tag"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceToVendor(index))}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceToVendor(index)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid="delete-location-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "DELETING..." : "DELETE"}
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="cancel-location-edit"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/80"
                disabled={saveMutation.isPending || !formData.name.trim()}
                data-testid="save-location-button"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "SAVING..." : (isEdit ? "UPDATE" : "CREATE")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
