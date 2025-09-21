import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    appName: string;
    version: string;
    adminCode: string;
  };
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentSettings
}: SettingsModalProps) {
  const [formData, setFormData] = useState({
    appName: "",
    version: "",
    adminCode: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && currentSettings) {
      setFormData({
        appName: currentSettings.appName || "Wasteland Blues",
        version: currentSettings.version || "Interactive Wasteland Navigator v2.281",
        adminCode: currentSettings.adminCode || "HOUSE-ALWAYS-WINS",
      });
    }
  }, [isOpen, currentSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries to update headers and settings display
      queryClient.invalidateQueries({ queryKey: ["/api/map/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/map/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Application settings have been saved successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update application settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.appName.trim() && formData.version.trim() && formData.adminCode.trim()) {
      updateSettingsMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      appName: currentSettings.appName || "Wasteland Blues",
      version: currentSettings.version || "Interactive Wasteland Navigator v2.281",
      adminCode: currentSettings.adminCode || "HOUSE-ALWAYS-WINS",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="pip-boy-border bg-card max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary terminal-glow text-center flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            APPLICATION SETTINGS
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-mono">
                APPLICATION NAME
              </Label>
              <Input
                value={formData.appName}
                onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="Enter application name"
                className="font-mono"
                data-testid="input-app-name"
                required
              />
              <p className="text-xs text-muted-foreground">
                This name will appear in the header of both public and admin interfaces
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-mono">
                VERSION STRING
              </Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="Enter version string"
                className="font-mono"
                data-testid="input-version"
                required
              />
              <p className="text-xs text-muted-foreground">
                Version or tagline displayed under the application name
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground font-mono">
                ADMIN ACCESS CODE
              </Label>
              <Input
                type="password"
                value={formData.adminCode}
                onChange={(e) => setFormData(prev => ({ ...prev, adminCode: e.target.value }))}
                placeholder="Enter admin code"
                className="font-mono"
                data-testid="input-admin-code"
                required
              />
              <p className="text-xs text-muted-foreground">
                Code required to access the admin interface. Keep this secure!
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateSettingsMutation.isPending}
              data-testid="cancel-settings-button"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              disabled={updateSettingsMutation.isPending || !formData.appName.trim() || !formData.version.trim() || !formData.adminCode.trim()}
              data-testid="save-settings-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettingsMutation.isPending ? "SAVING..." : "SAVE SETTINGS"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}