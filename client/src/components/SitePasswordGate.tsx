import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SitePasswordGateProps {
  children: React.ReactNode;
}

export default function SitePasswordGate({ children }: SitePasswordGateProps) {
  const [hasAccess, setHasAccess] = useState(() => {
    // Check if we have site access stored in session storage
    return sessionStorage.getItem('siteAccess') === 'true';
  });
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const checkPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("/api/site-auth", "POST", { password });
    },
    onSuccess: () => {
      setHasAccess(true);
      sessionStorage.setItem('siteAccess', 'true');
      toast({
        title: "Access granted",
        description: "Welcome to CampAIgner",
      });
    },
    onError: (error) => {
      toast({
        title: "Access denied",
        description: error.message || "Invalid password",
        variant: "destructive",
      });
      setPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    checkPasswordMutation.mutate(password);
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">CampAIgner</CardTitle>
          <CardDescription>
            Enter the access password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                data-testid="input-site-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={checkPasswordMutation.isPending || !password.trim()}
              data-testid="button-submit-password"
            >
              {checkPasswordMutation.isPending ? "Verifying..." : "Access Site"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}