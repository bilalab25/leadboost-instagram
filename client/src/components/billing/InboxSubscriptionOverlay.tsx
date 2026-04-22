import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Check, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useLanguage } from "@/hooks/useLanguage";

interface InboxSubscriptionOverlayProps {
  children: React.ReactNode;
}

export function InboxSubscriptionOverlay({
  children,
}: InboxSubscriptionOverlayProps) {
  const { activeBrandId } = useBrand();
  const { isSpanish } = useLanguage();

  const { data: inboxAccess, isLoading } = useQuery({
    queryKey: ["/api/billing", activeBrandId, "inbox-access"],
    queryFn: async () => {
      if (!activeBrandId) return { hasAccess: false };
      const res = await fetch(`/api/billing/${activeBrandId}/inbox-access`);
      if (!res.ok) return { hasAccess: false };
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest(
        "POST",
        `/api/billing/${activeBrandId}/subscribe-inbox`,
      );
      if (!res.ok) throw new Error("Failed to create checkout session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inboxAccess?.hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[calc(100vh-200px)]">
      {/* Blurred background content */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="filter blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-2xl border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {isSpanish
                ? "Desbloquea el Inbox de Instagram"
                : "Unlock the Instagram Inbox"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isSpanish
                ? "Responde a todas tus conversaciones de Instagram DM en un solo lugar"
                : "Respond to all your Instagram DM conversations in one place"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold">$99</span>
              <div className="text-left">
                <Badge variant="secondary">USD</Badge>
                <p className="text-sm text-muted-foreground">
                  {isSpanish ? "por mes" : "per month"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Feature>
                {isSpanish
                  ? "Bandeja de entrada dedicada para Instagram"
                  : "Dedicated Instagram inbox"}
              </Feature>
              <Feature>
                {isSpanish
                  ? "Responde mensajes directos de Instagram al instante"
                  : "Respond to Instagram direct messages instantly"}
              </Feature>
              <Feature>
                {isSpanish
                  ? "Historial completo de conversaciones"
                  : "Full conversation history"}
              </Feature>
              <Feature>
                {isSpanish
                  ? "Notificaciones en tiempo real"
                  : "Real-time notifications"}
              </Feature>
            </div>

            <Button
              size="lg"
              className="w-full text-lg py-6"
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isSpanish ? "Procesando..." : "Processing..."}
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {isSpanish ? "Suscribirse por $99/mes" : "Subscribe for $99/month"}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {isSpanish
                ? "Puedes cancelar en cualquier momento. Sin contratos a largo plazo."
                : "You can cancel anytime. No long-term contracts."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <Check className="h-3 w-3 text-green-500" />
      </div>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function InboxSubscriptionBanner() {
  const { activeBrandId } = useBrand();
  const { isSpanish } = useLanguage();

  const { data: inboxAccess } = useQuery({
    queryKey: ["/api/billing", activeBrandId, "inbox-access"],
    queryFn: async () => {
      if (!activeBrandId) return { hasAccess: false };
      const res = await fetch(`/api/billing/${activeBrandId}/inbox-access`);
      if (!res.ok) return { hasAccess: false };
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest(
        "POST",
        `/api/billing/${activeBrandId}/subscribe-inbox`,
      );
      if (!res.ok) throw new Error("Failed to create checkout session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (inboxAccess?.hasAccess) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">
            {isSpanish ? "Inbox bloqueado" : "Inbox locked"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSpanish
              ? "Suscríbete para acceder al inbox unificado"
              : "Subscribe to access the unified inbox"}
          </p>
        </div>
      </div>
      <Button
        onClick={() => subscribeMutation.mutate()}
        disabled={subscribeMutation.isPending}
      >
        {subscribeMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSpanish ? (
          "Suscribirse $99/mes"
        ) : (
          "Subscribe $99/month"
        )}
      </Button>
    </div>
  );
}
