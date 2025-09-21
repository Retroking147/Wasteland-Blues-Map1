import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess
}: AdminAuthModalProps) {
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (adminCode: string) => {
      const response = await apiRequest("POST", "/api/admin/verify", { code: adminCode });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isValid) {
        onSuccess();
        onClose();
        setCode("");
        toast({
          title: "Access Granted",
          description: "Welcome to admin mode",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid admin code",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Authentication Failed",
        description: "Unable to verify admin code",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verifyMutation.mutate(code.trim());
    }
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="pip-boy-border bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary terminal-glow text-center flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            ADMIN ACCESS REQUIRED
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              AUTHORIZATION CODE
            </Label>
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER ACCESS CODE"
              className="text-center font-mono tracking-widest bg-input border-border"
              data-testid="admin-code-input"
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
              disabled={verifyMutation.isPending || !code.trim()}
              data-testid="authenticate-button"
            >
              <Key className="h-4 w-4 mr-2" />
              {verifyMutation.isPending ? "VERIFYING..." : "AUTHENTICATE"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              data-testid="cancel-auth-button"
            >
              CANCEL
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
          <div>Security Level: CLASSIFIED</div>
          <div>Terminal ID: ADMIN-001</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
