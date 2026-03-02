import { GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";

export default function AdsDashboard() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        <div className="flex-1 p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isSpanish ? "Administrador de Anuncios" : "Ads Manager"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isSpanish
                    ? "Crea y administra tus anuncios."
                    : "Create and manage your ads"}
                </p>
              </div>
              <Button
                className="gap-2"
                data-testid="button-create-flow"
                disabled
              >
                <Plus className="h-4 w-4" />
                Create New Flow
              </Button>
            </div>
          </div>
          <Card className="p-12 text-center">
            <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Comming Soon
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your own ads.
            </p>
            <Button
              className="gap-2"
              data-testid="button-create-first-flow"
              disabled
            >
              <Plus className="h-4 w-4" />
              Create Your First Ad
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
