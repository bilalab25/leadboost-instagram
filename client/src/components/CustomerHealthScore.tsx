import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Clock,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';

interface CustomerHealthScoreProps {
  isSpanish?: boolean;
}

interface HealthMetric {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  details: string;
}

export function CustomerHealthScore({ isSpanish = false }: CustomerHealthScoreProps) {
  const overallHealthScore = 78; // Out of 100
  
  const healthMetrics: HealthMetric[] = isSpanish ? [
    {
      category: 'Engagement',
      score: 85,
      status: 'excellent',
      trend: 'up',
      details: 'Uso diario constante, 12 conversaciones por día'
    },
    {
      category: 'Adopción de Funciones',
      score: 72,
      status: 'good',
      trend: 'up',
      details: 'Usa 6 de 10 funciones principales'
    },
    {
      category: 'ROI Percibido',
      score: 91,
      status: 'excellent',
      trend: 'up',
      details: '+47% incremento en ventas registrado'
    },
    {
      category: 'Satisfacción',
      score: 68,
      status: 'warning',
      trend: 'down',
      details: 'Última puntuación NPS: 7/10'
    }
  ] : [
    {
      category: 'Engagement',
      score: 85,
      status: 'excellent',
      trend: 'up',
      details: 'Consistent daily usage, 12 conversations per day'
    },
    {
      category: 'Feature Adoption',
      score: 72,
      status: 'good',
      trend: 'up',
      details: 'Using 6 out of 10 core features'
    },
    {
      category: 'Perceived ROI',
      score: 91,
      status: 'excellent',
      trend: 'up',
      details: '+47% sales increase recorded'
    },
    {
      category: 'Satisfaction',
      score: 68,
      status: 'warning',
      trend: 'down',
      details: 'Last NPS score: 7/10'
    }
  ];

  const churnRisk = 15; // Percentage
  const churnRiskLevel = churnRisk < 20 ? 'low' : churnRisk < 40 ? 'medium' : 'high';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChurnRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              {isSpanish ? 'Salud del Cliente' : 'Customer Health Score'}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getChurnRiskColor(churnRiskLevel)}>
                {churnRisk}% {isSpanish ? 'Riesgo de Cancelación' : 'Churn Risk'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full border-8 border-blue-100 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <span className="text-2xl font-bold">{overallHealthScore}</span>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {overallHealthScore >= 80 ? (isSpanish ? 'Excelente' : 'Excellent') :
                   overallHealthScore >= 60 ? (isSpanish ? 'Bueno' : 'Good') :
                   overallHealthScore >= 40 ? (isSpanish ? 'Regular' : 'Fair') :
                   (isSpanish ? 'Crítico' : 'Critical')}
                </h3>
                <p className="text-gray-600">
                  {isSpanish ? 'Estado general del cliente' : 'Overall customer health'}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm font-medium">+5 {isSpanish ? 'pts esta semana' : 'pts this week'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">
                {isSpanish ? 'Próxima revisión' : 'Next review'}
              </div>
              <div className="font-medium text-gray-900">
                {isSpanish ? 'En 7 días' : 'In 7 days'}
              </div>
            </div>
          </div>

          <Progress value={overallHealthScore} className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{metric.category}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                      {metric.score}
                    </span>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>
                <Progress value={metric.score} className="mb-2" />
                <p className="text-xs text-gray-600">{metric.details}</p>
                <Badge className={`mt-2 text-xs ${getStatusColor(metric.status)}`}>
                  {metric.status === 'excellent' ? (isSpanish ? 'Excelente' : 'Excellent') :
                   metric.status === 'good' ? (isSpanish ? 'Bueno' : 'Good') :
                   metric.status === 'warning' ? (isSpanish ? 'Atención' : 'Warning') :
                   (isSpanish ? 'Crítico' : 'Critical')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 text-orange-600 mr-2" />
            {isSpanish ? 'Acciones Recomendadas' : 'Recommended Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Mejorar Satisfacción del Cliente' : 'Improve Customer Satisfaction'}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {isSpanish ? 
                    'El NPS ha bajado. Programa una llamada de seguimiento para obtener feedback.' :
                    'NPS has decreased. Schedule a follow-up call to gather feedback.'
                  }
                </p>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  {isSpanish ? 'Programar Llamada' : 'Schedule Call'}
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Explorar Funciones Avanzadas' : 'Explore Advanced Features'}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {isSpanish ? 
                    'Solo usa 6/10 funciones. Mostrar funciones no exploradas puede aumentar engagement.' :
                    'Only using 6/10 features. Showcasing unexplored features could boost engagement.'
                  }
                </p>
                <Button size="sm" variant="outline" className="border-blue-200 text-blue-600">
                  <Zap className="h-4 w-4 mr-2" />
                  {isSpanish ? 'Ver Tutorial' : 'Show Tutorial'}
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-200">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Compartir Caso de Éxito' : 'Share Success Story'}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {isSpanish ? 
                    'ROI excelente (+47%). Invitar a programa de referidos o testimonial.' :
                    'Excellent ROI (+47%). Invite to referral program or testimonial.'
                  }
                </p>
                <Button size="sm" variant="outline" className="border-green-200 text-green-600">
                  <Users className="h-4 w-4 mr-2" />
                  {isSpanish ? 'Programa Referidos' : 'Referral Program'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}