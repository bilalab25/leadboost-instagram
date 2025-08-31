import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Eye,
  MousePointer,
  RefreshCw
} from 'lucide-react';
import { SiInstagram, SiFacebook, SiWhatsapp, SiTiktok, SiLinkedin } from 'react-icons/si';

interface AnalyticsDashboardProps {
  isSpanish: boolean;
}

export function AnalyticsDashboard({ isSpanish }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const metrics = {
    conversations: { current: 847, previous: 623, change: 36 },
    appointments: { current: 156, previous: 134, change: 16 },
    revenue: { current: 18750, previous: 15200, change: 23 },
    conversionRate: { current: 68, previous: 58, change: 17 },
    avgResponseTime: { current: 1.8, previous: 2.4, change: -25 },
    customerSatisfaction: { current: 4.7, previous: 4.4, change: 7 }
  };

  const platformData = [
    { name: 'Instagram', conversations: 342, appointments: 89, revenue: 8920, icon: SiInstagram, color: 'bg-pink-500' },
    { name: 'Facebook', conversations: 267, appointments: 45, revenue: 4650, icon: SiFacebook, color: 'bg-blue-600' },
    { name: 'WhatsApp', conversations: 156, appointments: 18, revenue: 3240, icon: SiWhatsapp, color: 'bg-green-500' },
    { name: 'TikTok', conversations: 82, appointments: 4, revenue: 1940, icon: SiTiktok, color: 'bg-black' }
  ];

  const topServices = isSpanish ? [
    { name: 'Botox', bookings: 67, revenue: 6700, growth: 15 },
    { name: 'Limpieza Facial', bookings: 45, revenue: 3600, growth: 8 },
    { name: 'Masaje Relajante', bookings: 32, revenue: 2400, growth: -3 },
    { name: 'Manicure', bookings: 12, revenue: 480, growth: 22 }
  ] : [
    { name: 'Botox', bookings: 67, revenue: 6700, growth: 15 },
    { name: 'Facial Cleaning', bookings: 45, revenue: 3600, growth: 8 },
    { name: 'Relaxing Massage', bookings: 32, revenue: 2400, growth: -3 },
    { name: 'Manicure', bookings: 12, revenue: 480, growth: 22 }
  ];

  const peakHours = [
    { hour: '9 AM', activity: 23 },
    { hour: '12 PM', activity: 45 },
    { hour: '3 PM', activity: 67 },
    { hour: '6 PM', activity: 89 },
    { hour: '9 PM', activity: 34 }
  ];

  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    change, 
    icon: Icon, 
    format = 'number',
    suffix = '' 
  }: {
    title: string;
    value: number;
    previousValue: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
    suffix?: string;
  }) => {
    const formatValue = (val: number) => {
      if (format === 'currency') return `$${val.toLocaleString()}`;
      if (format === 'percentage') return `${val}%`;
      return val.toLocaleString() + suffix;
    };

    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <Badge variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'} className="text-xs">
              {isPositive ? '+' : ''}{change}%
              {isPositive ? <TrendingUp className="h-3 w-3 ml-1" /> : isNegative ? <TrendingDown className="h-3 w-3 ml-1" /> : null}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xs text-gray-500">
              {isSpanish ? 'vs período anterior' : 'vs previous period'}: {formatValue(previousValue)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full border border-blue-200 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-700 font-semibold">
              {isSpanish ? 'Dashboard Inteligente' : 'Smart Dashboard'}
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isSpanish ? 'Análisis Completo de Rendimiento' : 'Complete Performance Analytics'}
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {isSpanish 
              ? 'Métricas en tiempo real, insights accionables y reportes detallados para optimizar tu chatbot'
              : 'Real-time metrics, actionable insights and detailed reports to optimize your chatbot'
            }
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {[
                { key: '7d', label: isSpanish ? '7 días' : '7 days' },
                { key: '30d', label: isSpanish ? '30 días' : '30 days' },
                { key: '90d', label: isSpanish ? '90 días' : '90 days' }
              ].map((range) => (
                <Button
                  key={range.key}
                  variant={timeRange === range.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range.key as '7d' | '30d' | '90d')}
                  data-testid={`button-timerange-${range.key}`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <Button 
              onClick={refreshData} 
              disabled={isRefreshing}
              variant="outline" 
              size="sm"
              data-testid="button-refresh-data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? (isSpanish ? 'Actualizando...' : 'Refreshing...') : (isSpanish ? 'Actualizar' : 'Refresh')}
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard
            title={isSpanish ? "Conversaciones" : "Conversations"}
            value={metrics.conversations.current}
            previousValue={metrics.conversations.previous}
            change={metrics.conversations.change}
            icon={MessageSquare}
          />
          <MetricCard
            title={isSpanish ? "Citas Programadas" : "Appointments Booked"}
            value={metrics.appointments.current}
            previousValue={metrics.appointments.previous}
            change={metrics.appointments.change}
            icon={Calendar}
          />
          <MetricCard
            title={isSpanish ? "Ingresos Generados" : "Revenue Generated"}
            value={metrics.revenue.current}
            previousValue={metrics.revenue.previous}
            change={metrics.revenue.change}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title={isSpanish ? "Tasa de Conversión" : "Conversion Rate"}
            value={metrics.conversionRate.current}
            previousValue={metrics.conversionRate.previous}
            change={metrics.conversionRate.change}
            icon={Target}
            format="percentage"
          />
          <MetricCard
            title={isSpanish ? "Tiempo de Respuesta" : "Avg Response Time"}
            value={metrics.avgResponseTime.current}
            previousValue={metrics.avgResponseTime.previous}
            change={metrics.avgResponseTime.change}
            icon={Clock}
            suffix="s"
          />
          <MetricCard
            title={isSpanish ? "Satisfacción Cliente" : "Customer Satisfaction"}
            value={metrics.customerSatisfaction.current}
            previousValue={metrics.customerSatisfaction.previous}
            change={metrics.customerSatisfaction.change}
            icon={Star}
            suffix="/5"
          />
        </div>

        <Tabs defaultValue="platforms" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="platforms" data-testid="tab-platforms">
              {isSpanish ? 'Plataformas' : 'Platforms'}
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              {isSpanish ? 'Servicios' : 'Services'}
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              {isSpanish ? 'Actividad' : 'Activity'}
            </TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">
              {isSpanish ? 'Tendencias' : 'Trends'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                  {isSpanish ? 'Rendimiento por Plataforma' : 'Performance by Platform'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {platformData.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <Card key={platform.name} className="bg-gradient-to-br from-white to-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round((platform.conversations / 847) * 100)}%
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{platform.name}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{isSpanish ? 'Conversaciones' : 'Conversations'}:</span>
                              <span className="font-medium">{platform.conversations}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{isSpanish ? 'Citas' : 'Appointments'}:</span>
                              <span className="font-medium">{platform.appointments}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{isSpanish ? 'Ingresos' : 'Revenue'}:</span>
                              <span className="font-medium">${platform.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  {isSpanish ? 'Servicios Más Populares' : 'Top Services'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600">
                            {service.bookings} {isSpanish ? 'reservas' : 'bookings'} • ${service.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={service.growth > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {service.growth > 0 ? '+' : ''}{service.growth}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  {isSpanish ? 'Horarios de Mayor Actividad' : 'Peak Activity Hours'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {peakHours.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{hour.hour}</span>
                      <div className="flex items-center flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${hour.activity}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 min-w-[60px] text-right">
                        {hour.activity} {isSpanish ? 'msgs' : 'msgs'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  {isSpanish ? 'Tendencias de Crecimiento' : 'Growth Trends'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      +247%
                    </div>
                    <p className="text-gray-600">
                      {isSpanish ? 'Crecimiento total en conversiones' : 'Total growth in conversions'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg text-center">
                      <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">12.5K</div>
                      <div className="text-sm text-gray-600">{isSpanish ? 'Vistas totales' : 'Total views'}</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg text-center">
                      <MousePointer className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">3.8K</div>
                      <div className="text-sm text-gray-600">{isSpanish ? 'Interacciones' : 'Interactions'}</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg text-center">
                      <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">847</div>
                      <div className="text-sm text-gray-600">{isSpanish ? 'Conversiones' : 'Conversions'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Target className="h-5 w-5 mr-2" />
              {isSpanish ? 'Recomendaciones para Optimizar' : 'Optimization Recommendations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {isSpanish ? '📈 Aumentar conversiones en Instagram' : '📈 Boost Instagram conversions'}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {isSpanish 
                    ? 'Instagram tiene el mayor tráfico pero menor tasa de conversión. Optimiza las respuestas.'
                    : 'Instagram has the highest traffic but lower conversion rate. Optimize responses.'
                  }
                </p>
                <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                  {isSpanish ? 'Optimizar' : 'Optimize'}
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {isSpanish ? '⏰ Ajustar horarios de respuesta' : '⏰ Adjust response schedule'}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {isSpanish 
                    ? 'Mayor actividad entre 3-6 PM. Considera personal adicional en estos horarios.'
                    : 'Peak activity between 3-6 PM. Consider additional staff during these hours.'
                  }
                </p>
                <Button size="sm" variant="outline">
                  {isSpanish ? 'Configurar' : 'Configure'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}