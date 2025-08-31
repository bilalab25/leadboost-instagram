import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  MessageSquare,
  Trophy,
  Flame,
  Plus,
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface GoalTrackingProps {
  isSpanish?: boolean;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  period: 'monthly' | 'weekly' | 'quarterly';
  category: 'revenue' | 'appointments' | 'conversations' | 'customers';
  icon: React.ReactNode;
  color: string;
  deadline: string;
  streak: number;
}

export function GoalTracking({ isSpanish = false }: GoalTrackingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly' | 'quarterly'>('monthly');

  const goals: Goal[] = isSpanish ? [
    {
      id: '1',
      title: 'Ingresos Mensuales',
      target: 25000,
      current: 18750,
      unit: '$',
      period: 'monthly',
      category: 'revenue',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      deadline: '2024-02-29',
      streak: 3
    },
    {
      id: '2',
      title: 'Citas Programadas',
      target: 120,
      current: 89,
      unit: '',
      period: 'monthly',
      category: 'appointments',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      deadline: '2024-02-29',
      streak: 2
    },
    {
      id: '3',
      title: 'Nuevos Clientes',
      target: 50,
      current: 34,
      unit: '',
      period: 'monthly',
      category: 'customers',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      deadline: '2024-02-29',
      streak: 1
    },
    {
      id: '4',
      title: 'Conversaciones Semanales',
      target: 200,
      current: 247,
      unit: '',
      period: 'weekly',
      category: 'conversations',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      deadline: '2024-02-18',
      streak: 4
    }
  ] : [
    {
      id: '1',
      title: 'Monthly Revenue',
      target: 25000,
      current: 18750,
      unit: '$',
      period: 'monthly',
      category: 'revenue',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600 bg-green-50 border-green-200',
      deadline: '2024-02-29',
      streak: 3
    },
    {
      id: '2',
      title: 'Appointments Booked',
      target: 120,
      current: 89,
      unit: '',
      period: 'monthly',
      category: 'appointments',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      deadline: '2024-02-29',
      streak: 2
    },
    {
      id: '3',
      title: 'New Customers',
      target: 50,
      current: 34,
      unit: '',
      period: 'monthly',
      category: 'customers',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      deadline: '2024-02-29',
      streak: 1
    },
    {
      id: '4',
      title: 'Weekly Conversations',
      target: 200,
      current: 247,
      unit: '',
      period: 'weekly',
      category: 'conversations',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      deadline: '2024-02-18',
      streak: 4
    }
  ];

  const filteredGoals = goals.filter(goal => goal.period === selectedPeriod);

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) {
      return { 
        text: isSpanish ? 'Completado' : 'Completed', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      };
    } else if (percentage >= 80) {
      return { 
        text: isSpanish ? 'En Camino' : 'On Track', 
        className: 'bg-blue-100 text-blue-800 border-blue-200' 
      };
    } else if (percentage >= 50) {
      return { 
        text: isSpanish ? 'Progreso' : 'Progress', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    } else {
      return { 
        text: isSpanish ? 'Atrasado' : 'Behind', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 text-indigo-600 mr-3" />
              {isSpanish ? 'Seguimiento de Objetivos' : 'Goal Tracking'}
            </CardTitle>
            <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600">
              <Plus className="h-4 w-4 mr-2" />
              {isSpanish ? 'Nuevo Objetivo' : 'New Goal'}
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            {(['monthly', 'weekly', 'quarterly'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="text-xs"
              >
                {period === 'monthly' ? (isSpanish ? 'Mensual' : 'Monthly') :
                 period === 'weekly' ? (isSpanish ? 'Semanal' : 'Weekly') :
                 (isSpanish ? 'Trimestral' : 'Quarterly')}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {filteredGoals.filter(g => getProgressPercentage(g.current, g.target) >= 100).length}
                </div>
                <div className="text-sm text-gray-600">
                  {isSpanish ? 'Completados' : 'Completed'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredGoals.filter(g => getProgressPercentage(g.current, g.target) >= 80 && getProgressPercentage(g.current, g.target) < 100).length}
                </div>
                <div className="text-sm text-gray-600">
                  {isSpanish ? 'En Camino' : 'On Track'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {filteredGoals.length}
                </div>
                <div className="text-sm text-gray-600">
                  {isSpanish ? 'Objetivos Totales' : 'Total Goals'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-orange-600 mb-1">
                <Flame className="h-5 w-5 mr-1" />
                <span className="font-bold text-xl">
                  {Math.max(...filteredGoals.map(g => g.streak))}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {isSpanish ? 'Mejor Racha' : 'Best Streak'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const progress = getProgressPercentage(goal.current, goal.target);
          const status = getStatusBadge(goal.current, goal.target);
          const daysLeft = getDaysLeft(goal.deadline);
          
          return (
            <Card key={goal.id} className={`border-2 ${goal.color.split(' ').slice(2).join(' ')} hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl ${goal.color} flex items-center justify-center mr-3`}>
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600">
                        {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={status.className}>
                      {status.text}
                    </Badge>
                    {goal.streak > 0 && (
                      <div className="flex items-center mt-2 text-orange-600">
                        <Flame className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{goal.streak}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(progress)}%
                    </span>
                    {progress >= 100 && (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {daysLeft > 0 ? 
                        `${daysLeft} ${isSpanish ? 'días restantes' : 'days left'}` :
                        (isSpanish ? 'Vencido' : 'Overdue')
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-green-600">
                      +{Math.round((goal.current / goal.target) * 100 * 0.1)}% {isSpanish ? 'esta semana' : 'this week'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {progress >= 100 ? (
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Trophy className="h-4 w-4 mr-2" />
                      {isSpanish ? '¡Objetivo Alcanzado!' : 'Goal Achieved!'}
                    </Button>
                  ) : progress >= 80 ? (
                    <Button size="sm" variant="outline" className="w-full">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {isSpanish ? 'Mantener Ritmo' : 'Keep Momentum'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full text-blue-600 border-blue-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      {isSpanish ? 'Ver Estrategia' : 'View Strategy'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievements Section */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
            {isSpanish ? 'Logros Recientes' : 'Recent Achievements'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {isSpanish ? 'Meta de Conversaciones' : 'Conversation Goal'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isSpanish ? 'Superaste tu objetivo semanal!' : 'Exceeded weekly target!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Flame className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {isSpanish ? 'Racha de 4 Semanas' : '4-Week Streak'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isSpanish ? 'Constancia en objetivos' : 'Consistent goal hitting'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {isSpanish ? 'ROI +47%' : 'ROI +47%'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isSpanish ? 'Crecimiento excepcional' : 'Exceptional growth'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}