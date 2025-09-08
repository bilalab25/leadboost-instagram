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
  const [hasAccess, setHasAccess] = useState(false); // Always start with false to show password screen
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const checkPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      console.log("Attempting password check with:", password);
      try {
        const response = await fetch("/api/site-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
          credentials: "include", // Important for sessions
        });
        
        const data = await response.json();
        console.log("Response:", response.status, data);
        
        if (!response.ok) {
          throw new Error(data.message || "Authentication failed");
        }
        
        return data;
      } catch (error) {
        console.error("Password check error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Password success:", data);
      setHasAccess(true);
      try {
        sessionStorage.setItem('siteAccess', 'true');
      } catch (error) {
        console.log("SessionStorage not available:", error);
      }
      toast({
        title: "Access granted",
        description: "Welcome to CampAIgner",
      });
    },
    onError: (error: any) => {
      console.error("Password error:", error);
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