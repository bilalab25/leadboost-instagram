import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gift, Share2, DollarSign, Users, Copy, Check, Mail, MessageSquare, Sparkles, Trophy, Star } from 'lucide-react';
import { SiFacebook, SiX, SiWhatsapp, SiLinkedin, SiInstagram } from 'react-icons/si';

interface ReferralProgramProps {
  isSpanish: boolean;
}

export function ReferralProgram({ isSpanish }: ReferralProgramProps) {
  const [referralCode, setReferralCode] = useState('LEADBOOST-VIP2024');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = `https://leadboost.com/signup?ref=${referralCode}`;
  
  const shareMessage = isSpanish 
    ? "🚀 ¡Descubre LeadBoost! El único chatbot con IA que programa citas automáticamente mientras duermes. Perfecto para salones, spas y consultores. ¡Prueba gratis con mi enlace!"
    : "🚀 Discover LeadBoost! The only AI chatbot that books appointments automatically while you sleep. Perfect for salons, spas, and consultants. Try it free with my link!";

  const rewards = isSpanish ? [
    { title: '1 Referido', reward: '$100 USD', description: 'Crédito instantáneo', icon: <DollarSign className="h-8 w-8" /> },
    { title: '5 Referidos', reward: '1 Mes Gratis', description: 'Plan Premium', icon: <Gift className="h-8 w-8" /> },
    { title: '10 Referidos', reward: '$500 USD', description: 'Bono especial', icon: <Trophy className="h-8 w-8" /> },
    { title: '25 Referidos', reward: 'Plan Vitalicio', description: 'Acceso permanente', icon: <Star className="h-8 w-8" /> }
  ] : [
    { title: '1 Referral', reward: '$100 USD', description: 'Instant credit', icon: <DollarSign className="h-8 w-8" /> },
    { title: '5 Referrals', reward: '1 Month Free', description: 'Premium Plan', icon: <Gift className="h-8 w-8" /> },
    { title: '10 Referrals', reward: '$500 USD', description: 'Special bonus', icon: <Trophy className="h-8 w-8" /> },
    { title: '25 Referrals', reward: 'Lifetime Plan', description: 'Permanent access', icon: <Star className="h-8 w-8" /> }
  ];

  const shareOnPlatform = (platform: string) => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(referralLink);
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
      x: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedMessage} ${encodedUrl}`,
      instagram: referralLink // Instagram doesn't support direct sharing, just copy link
    };
    
    if (platform === 'instagram') {
      copyToClipboard(referralLink);
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-green-100 px-4 py-2 rounded-full border border-emerald-200 mb-4">
            <Sparkles className="h-5 w-5 text-emerald-600 mr-2" />
            <span className="text-emerald-700 font-semibold">
              {isSpanish ? 'Programa VIP de Referidos' : 'VIP Referral Program'}
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isSpanish ? 'Gana hasta $500 USD por cada referido' : 'Earn up to $500 USD per referral'}
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isSpanish 
              ? 'Comparte LeadBoost con otros emprendedores y recibe recompensas increíbles por cada persona que se una'
              : 'Share LeadBoost with other entrepreneurs and get amazing rewards for each person who joins'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Share Section */}
          <Card className="bg-white/80 backdrop-blur-sm border border-green-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold">
                <Share2 className="h-6 w-6 text-emerald-600 mr-3" />
                {isSpanish ? 'Comparte tu Enlace' : 'Share Your Link'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isSpanish ? 'Tu código de referido' : 'Your referral code'}
                </label>
                <div className="flex space-x-2">
                  <Input 
                    value={referralCode}
                    readOnly 
                    className="bg-white/80 font-mono text-lg"
                  />
                  <Button 
                    onClick={() => copyToClipboard(referralCode)}
                    variant="outline"
                    data-testid="button-copy-code"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isSpanish ? 'Tu enlace personalizado' : 'Your personalized link'}
                </label>
                <div className="flex space-x-2">
                  <Input 
                    value={referralLink}
                    readOnly 
                    className="bg-white/80 text-sm"
                  />
                  <Button 
                    onClick={() => copyToClipboard(referralLink)}
                    variant="outline"
                    data-testid="button-copy-link"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {isSpanish ? 'Compartir en redes sociales' : 'Share on social media'}
                </p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => shareOnPlatform('facebook')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-share-facebook"
                  >
                    <SiFacebook className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => shareOnPlatform('x')}
                    size="sm"
                    className="bg-black hover:bg-gray-800 text-white"
                    data-testid="button-share-x"
                  >
                    <SiX className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => shareOnPlatform('linkedin')}
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    data-testid="button-share-linkedin"
                  >
                    <SiLinkedin className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => shareOnPlatform('whatsapp')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-share-whatsapp"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => shareOnPlatform('instagram')}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    data-testid="button-share-instagram"
                  >
                    <SiInstagram className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold">
                <Users className="h-6 w-6 mr-3" />
                {isSpanish ? 'Tus Estadísticas' : 'Your Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-3xl font-bold mb-1">12</div>
                  <div className="text-sm opacity-90">{isSpanish ? 'Referidos Activos' : 'Active Referrals'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-3xl font-bold mb-1">$1,200</div>
                  <div className="text-sm opacity-90">{isSpanish ? 'Ganado Total' : 'Total Earned'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-3xl font-bold mb-1">8</div>
                  <div className="text-sm opacity-90">{isSpanish ? 'Este Mes' : 'This Month'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-3xl font-bold mb-1">$400</div>
                  <div className="text-sm opacity-90">{isSpanish ? 'Próximo Pago' : 'Next Payout'}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{isSpanish ? 'Progreso al próximo nivel' : 'Progress to next level'}</span>
                  <span>12/15</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs mt-2 opacity-80">
                  {isSpanish ? '3 referidos más para desbloquear el bono de $500' : '3 more referrals to unlock $500 bonus'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Grid */}
        <div className="mb-12">
          <h4 className="text-2xl font-bold text-center text-gray-900 mb-8">
            {isSpanish ? 'Sistema de Recompensas' : 'Reward System'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewards.map((reward, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    {reward.icon}
                  </div>
                  <h5 className="font-bold text-lg text-gray-900 mb-2">{reward.title}</h5>
                  <div className="text-2xl font-black text-emerald-600 mb-1">{reward.reward}</div>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <Card className="bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-sm border border-emerald-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isSpanish ? 'Cómo Funciona' : 'How It Works'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                  1
                </div>
                <h5 className="font-bold text-lg text-gray-900 mb-2">
                  {isSpanish ? 'Comparte tu enlace' : 'Share your link'}
                </h5>
                <p className="text-gray-600 text-sm">
                  {isSpanish ? 'Usa tu código personalizado en redes sociales, email o WhatsApp' : 'Use your personalized code on social media, email or WhatsApp'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                  2
                </div>
                <h5 className="font-bold text-lg text-gray-900 mb-2">
                  {isSpanish ? 'Tus amigos se registran' : 'Your friends sign up'}
                </h5>
                <p className="text-gray-600 text-sm">
                  {isSpanish ? 'Cuando se registren con tu enlace, automáticamente quedan vinculados a ti' : 'When they sign up with your link, they are automatically linked to you'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                  3
                </div>
                <h5 className="font-bold text-lg text-gray-900 mb-2">
                  {isSpanish ? 'Recibe tus recompensas' : 'Get your rewards'}
                </h5>
                <p className="text-gray-600 text-sm">
                  {isSpanish ? 'Gana desde $100 hasta planes vitalicios por cada referido exitoso' : 'Earn from $100 to lifetime plans for each successful referral'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}