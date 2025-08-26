import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Target, ArrowRight, Plus, Database, 
  MessageSquare, Users, TrendingUp, Clock, 
  BarChart3, Zap, Globe, Instagram, 
  Facebook, Twitter, Linkedin, Youtube,
  Home, Calendar, Settings, BarChart2, Brain, Mail
} from "lucide-react";
import { 
  SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, 
  SiLinkedin, SiYoutube, SiX, SiTelegram 
} from "react-icons/si";

export default function SpanishPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LeadBoost</h1>
              <p className="text-sm text-gray-500">Gestión de Redes Sociales con IA</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              🇪🇸 Vista Previa en Español
            </Badge>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="Usuario" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg">
              <Home className="w-5 h-5 mr-3" />
              Panel Principal
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <MessageSquare className="w-5 h-5 mr-3" />
              Mensajes
              <Badge className="ml-auto bg-red-100 text-red-800">12</Badge>
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 mr-3" />
              Campañas
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <Brain className="w-5 h-5 mr-3" />
              Planificador IA
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <BarChart3 className="w-5 h-5 mr-3" />
              Analíticas
            </div>
            
            {/* Cuentas Conectadas */}
            <div className="pt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Cuentas Conectadas
              </h3>
              <div className="space-y-2">
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <SiInstagram className="w-5 h-5 mr-3 text-pink-500" />
                  <span className="flex-1">@mi_empresa</span>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <SiFacebook className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="flex-1">Mi Empresa</span>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <SiLinkedin className="w-5 h-5 mr-3 text-blue-700" />
                  <span className="flex-1">Mi Empresa SL</span>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido de vuelta, Juan!</h1>
                <p className="text-gray-600">Aquí tienes un resumen de tu actividad en redes sociales</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                  <Database className="mr-2 h-4 w-4" />
                  Cargar Datos Demo
                </Button>
                <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Campaña
                </Button>
              </div>
            </div>
          </div>

          {/* Sistema Waterfall Hero */}
          <div className="mb-12">
            <Card className="bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900">Sistema Waterfall</h2>
                      <p className="text-brand-600 font-semibold">Una idea → Todos lados</p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
                    Convierte una sola idea en campañas optimizadas para 21+ plataformas. 
                    Todo en el formato correcto, al tamaño perfecto, listo para lanzar.
                  </p>
                </div>
                
                {/* Waterfall Visual Flow */}
                <div className="bg-white rounded-2xl p-6 shadow-inner border border-gray-100 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* UNA IDEA */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-green-600 mb-1">UNA IDEA</h3>
                      <p className="text-sm text-gray-600">"Lanzar producto nuevo"</p>
                    </div>
                    
                    {/* ARROW */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-brand-400 hidden md:block" />
                    </div>
                    
                    {/* PLATAFORMAS */}
                    <div className="text-center">
                      <div className="grid grid-cols-3 gap-2 mb-3 max-w-32 mx-auto">
                        <SiInstagram className="w-8 h-8 text-pink-500" />
                        <SiTiktok className="w-8 h-8 text-gray-800" />
                        <SiFacebook className="w-8 h-8 text-blue-600" />
                        <SiWhatsapp className="w-8 h-8 text-green-500" />
                        <SiLinkedin className="w-8 h-8 text-blue-700" />
                        <SiYoutube className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-600 mb-1">TODOS LADOS</h3>
                      <p className="text-sm text-gray-600">21+ Plataformas</p>
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="text-center">
                  <Button size="lg" className="bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg">
                    <Zap className="mr-2 h-5 w-5" />
                    Crear Campaña Waterfall
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,847</div>
                <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Leer</CardTitle>
                <MessageSquare className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campañas Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">+4 este mes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compromiso Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.8K</div>
                <p className="text-xs text-muted-foreground">+18% este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Posts Generados por IA</h3>
                    <p className="text-green-600 text-sm">Este mes</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-700 mb-2">156</div>
                <p className="text-sm text-green-600">Ahorrando 42 horas de trabajo</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800">Impacto en Ingresos</h3>
                    <p className="text-purple-600 text-sm">Atribuido a campañas</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-2">€18.2K</div>
                <p className="text-sm text-purple-600">+24% ROI este trimestre</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <SiInstagram className="w-5 h-5 text-pink-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nueva publicación programada</p>
                    <p className="text-xs text-gray-500">hace 2 minutos • @mi_empresa</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevo mensaje de María González</p>
                    <p className="text-xs text-gray-500">hace 15 minutos • Instagram</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <Brain className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Plan de contenido generado con IA</p>
                    <p className="text-xs text-gray-500">hace 1 hora • Planificador IA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex-col py-4">
                <Plus className="h-6 w-6 mb-2" />
                <span className="text-sm">Crear Nuevo Post</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <Brain className="h-6 w-6 mb-2" />
                <span className="text-sm">Generar Contenido IA</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Programar Posts</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="text-sm">Ver Analíticas</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}