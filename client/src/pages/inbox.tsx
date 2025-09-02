import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import MessageList from "@/components/MessageList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Inbox() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isSpanish } = useLanguage();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? 'Bandeja de Entrada' : 'Inbox'} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Search and Filter Tools */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex justify-end items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder={isSpanish ? "Buscar mensajes..." : "Search messages..."} 
                className="pl-10 w-64" 
                data-testid="input-search-messages"
              />
            </div>
            
            <Button variant="outline" size="icon" data-testid="button-filter">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Inbox Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Inbox Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900" data-testid="stat-total-messages">24</div>
                    <div className="text-sm text-gray-500">{isSpanish ? 'Mensajes Totales' : 'Total Messages'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600" data-testid="stat-unread-messages">12</div>
                    <div className="text-sm text-gray-500">{isSpanish ? 'Sin Leer' : 'Unread'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-urgent-messages">3</div>
                    <div className="text-sm text-gray-500">{isSpanish ? 'Urgente' : 'Urgent'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-avg-response">2.5h</div>
                    <div className="text-sm text-gray-500">{isSpanish ? 'Respuesta Promedio' : 'Avg Response'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Messages List */}
              <Card>
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle>{isSpanish ? 'Todos los Mensajes' : 'All Messages'}</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-mark-all-read">
                        {isSpanish ? 'Marcar Todo Leído' : 'Mark All Read'}
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-export">
                        {isSpanish ? 'Exportar' : 'Export'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <MessageList showHeader={true} />
                </CardContent>
              </Card>
              
            </div>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
