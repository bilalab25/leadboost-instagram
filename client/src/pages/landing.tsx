import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Bot,
  BarChart3,
  ArrowRight,
  Star,
  Check,
  Play,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Shield,
  Clock,
  ChevronDown,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Mail,
  Hash,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiWhatsapp,
  SiLinkedin,
  SiYoutube,
  SiX,
  SiPinterest,
} from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { HelpDropdown } from "@/components/HelpDropdown";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";
import boostyImage from "@assets/Gemini_Generated_Image_vxt1kgvxt1kgvxt1_1764170274959.png";
import boostyVideo from "@assets/Video_de_Boosty_Saludando_1764171160244.mp4";
import boostyLoopVideo from "@assets/Boosty_Mascot_Looping_Animation_1764605997237.mp4";
import boostyWavingVideo from "@assets/Boosty_Mascot_Waving_Video_Generation_1764607325012.mp4";
import boostyNewVideo from "@assets/202512011048_1764608229868.mp4";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className="min-h-screen relative text-gray-900 overflow-hidden"
      style={{ backgroundColor: "#F8F8FA" }}
    >
      {/* Header */}
      <header
        className="relative z-50 backdrop-blur-md border-b border-gray-200 shadow-sm"
        style={{ backgroundColor: "rgba(248, 248, 250, 0.95)" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src={leadBoostLogo}
                alt="CampAIgner"
                className="h-8 w-auto"
              />
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors p-0 h-auto"
                  >
                    {isSpanish ? "Características" : "Features"}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish
                          ? "Campañas IA Automatizadas"
                          : "AI Automated Campaigns"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "IA crea contenido basado en datos reales"
                          : "AI Creates Content Based On Real Data"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? "Bandeja Unificada" : "Unified Inbox"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "Gestiona todos los mensajes desde un lugar"
                          : "Manage all messages from one place"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish
                          ? "Análisis en Tiempo Real"
                          : "Real-Time Analytics"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "Métricas de ventas y ROI automáticas"
                          : "Automatic sales and ROI metrics"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Globe className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? "21+ Plataformas" : "21+ Platforms"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "Instagram, TikTok, Facebook, LinkedIn y más"
                          : "Instagram, TikTok, Facebook, LinkedIn and more"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Users className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? "CRM Inteligente" : "Smart CRM"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "Gestión automática de leads y clientes"
                          : "Automatic lead and customer management"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Shield className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish
                          ? "Seguridad Empresarial"
                          : "Enterprise Security"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish
                          ? "Cifrado, GDPR y backups automáticos"
                          : "Encryption, GDPR and automatic backups"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors p-0 h-auto"
                asChild
              >
                <a href="#pricing">{isSpanish ? "Precios" : "Pricing"}</a>
              </Button>
            </nav>

            <div className="flex items-center space-x-4">
              <HelpDropdown isSpanish={isSpanish} />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-gray-600 hover:text-gray-900"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isSpanish ? "EN" : "ES"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                data-testid="button-login"
                onClick={() => navigate("/login")}
              >
                {isSpanish ? "Iniciar Sesión" : "Login"}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                data-testid="button-header-cta"
                onClick={() => navigate("/login")}
              >
                {isSpanish ? "Empezar Gratis" : "Start Free"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Apple/Squarespace Inspired */}
      <section
        className="relative py-12 sm:py-16 lg:py-20 pb-0 overflow-hidden"
        style={{ backgroundColor: "#F8F8FA" }}
      >
        {/* Floating Social Media Cards - Very Subtle */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] blur-lg">
          {/* Instagram Post - Square */}
          <div
            className="absolute bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "80px",
              height: "80px",
              left: "8%",
              top: "20%",
              animation: "float 8s ease-in-out infinite",
            }}
          >
            <SiInstagram className="w-6 h-6 text-white" />
          </div>

          {/* Instagram Story - Vertical */}
          <div
            className="absolute bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "50px",
              height: "90px",
              right: "12%",
              top: "25%",
              animation: "float 9s ease-in-out infinite 1s",
            }}
          >
            <SiInstagram className="w-5 h-5 text-white" />
          </div>

          {/* LinkedIn Article - Landscape */}
          <div
            className="absolute bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "100px",
              height: "50px",
              left: "6%",
              top: "65%",
              animation: "float 10s ease-in-out infinite 2s",
            }}
          >
            <SiLinkedin className="w-5 h-5 text-white" />
          </div>

          {/* TikTok Cover - Vertical */}
          <div
            className="absolute bg-gradient-to-br from-black to-gray-800 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "50px",
              height: "90px",
              right: "10%",
              top: "70%",
              animation: "float 7s ease-in-out infinite 0.5s",
            }}
          >
            <SiTiktok className="w-5 h-5 text-white" />
          </div>

          {/* Facebook Post - Landscape */}
          <div
            className="absolute bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "100px",
              height: "50px",
              left: "78%",
              top: "15%",
              animation: "float 11s ease-in-out infinite 1.5s",
            }}
          >
            <SiFacebook className="w-5 h-5 text-white" />
          </div>

          {/* Twitter/X Post - Landscape */}
          <div
            className="absolute bg-gradient-to-br from-black to-gray-800 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "90px",
              height: "50px",
              left: "15%",
              top: "40%",
              animation: "float 12s ease-in-out infinite 3s",
            }}
          >
            <SiX className="w-5 h-5 text-white" />
          </div>

          {/* YouTube Thumbnail - Landscape */}
          <div
            className="absolute bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "110px",
              height: "60px",
              right: "22%",
              top: "50%",
              animation: "float 13s ease-in-out infinite 2.5s",
            }}
          >
            <SiYoutube className="w-5 h-5 text-white" />
          </div>

          {/* Pinterest Pin - Tall */}
          <div
            className="absolute bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "65px",
              height: "100px",
              left: "88%",
              top: "60%",
              animation: "float 8.5s ease-in-out infinite 1.8s",
            }}
          >
            <SiPinterest className="w-5 h-5 text-white" />
          </div>

          {/* Email Banner - Wide */}
          <div
            className="absolute bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "120px",
              height: "40px",
              left: "65%",
              top: "85%",
              animation: "float 9.5s ease-in-out infinite 0.8s",
            }}
          >
            <Mail className="w-5 h-5 text-white" />
          </div>

          {/* Threads Post - Square */}
          <div
            className="absolute bg-gradient-to-br from-black to-gray-800 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              width: "75px",
              height: "75px",
              left: "30%",
              top: "80%",
              animation: "float 10.5s ease-in-out infinite 2.2s",
            }}
          >
            <Hash className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center z-10">
          {/* Trust Badge - Slogan Style */}
          <div
            className={`inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full border border-gray-200 shadow-lg transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ backgroundColor: "#F8F8FA" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-base font-medium text-gray-700">
              {isSpanish
                ? "Todo tu marketing, totalmente automatizado"
                : "Your Entire Marketing, Done by AI."}
            </span>
          </div>

          {/* Main Headline - Premium Typography */}
          <h1
            className={`text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight mb-12 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 bg-clip-text text-transparent transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {isSpanish ? (
              <>
                Haz Crecer Tus Ventas,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Automáticamente.
                </span>
              </>
            ) : (
              <>
                Grow Your Sales,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Automatically.
                </span>
              </>
            )}
          </h1>

          {/* Subtitle - Enhanced */}
          <p
            className={`text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-16 max-w-5xl mx-auto leading-relaxed font-light transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {isSpanish
              ? "La única plataforma que recopila tus datos empresariales, construye campañas inteligentes que se ejecutan automáticamente, y cierra ventas—todo sin esfuerzo manual."
              : "The only platform that collects your business data, creates intelligent content that runs automatically, and closes sales—all on autopilot."}
          </p>

          {/* Primary CTA - Apple Style */}
          <div
            className={`flex flex-col items-center gap-6 mb-20 transition-all duration-1000 delay-800 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-16 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
              data-testid="button-start-free-trial"
              onClick={() => navigate("/login")}
            >
              {isSpanish ? "Comenzar Gratis Ahora" : "Start Free Now"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-500 text-sm">
              {isSpanish
                ? "Prueba gratis por 14 días • No se requiere tarjeta de crédito"
                : "Free 14-day trial • No credit card required"}
            </p>
          </div>
        </div>
      </section>

      {/* Boosty Video Hero Section - Full Width */}
      <section
        className="relative py-12 lg:py-20 overflow-hidden"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Boosty Video - Full Width (behind decorative elements) */}
        <div className="w-full flex justify-center relative">
          <video
            src={boostyNewVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-w-4xl h-auto"
            data-testid="boosty-loop-video"
          />
          
          {/* Trust indicators - positioned in front of video */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center items-center gap-4 sm:gap-8 px-4">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  {isSpanish ? "Impulsado por IA" : "Powered by AI"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  {isSpanish ? "+10,000 usuarios" : "+10,000 users"}
                </div>
              </div>
            </div>
          </div>

          {/* Customer rating - positioned in front of video at bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex justify-center items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                J
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
            </div>
            <span className="text-sm text-gray-700 font-medium">
              <span className="font-bold text-gray-900">4.9/5</span>{" "}
              {isSpanish ? "de" : "from"}{" "}
              <span className="font-bold text-gray-900">4,268</span>{" "}
              {isSpanish ? "clientes" : "customers"}{" "}
              <Star className="w-4 h-4 text-yellow-500 inline-block" />
            </span>
          </div>
        </div>
      </section>

      {/* Circular AI Process Diagram */}
      <section
        id="circle-section"
        className="relative py-32 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Purple glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          {/* Desktop Circular Diagram */}
          <div className="hidden lg:block relative h-[800px]">
            {/* Center Content */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20 max-w-md">
              <h2 className="text-4xl xl:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isSpanish
                  ? "Cómo Funciona el Motor IA"
                  : "How The AI Engine Works"}
              </h2>
              <p className="text-lg text-gray-300">
                {isSpanish
                  ? "Cinco pasos automatizados que transforman datos en ventas reales"
                  : "Five automated steps that turn data into real sales"}
              </p>
            </div>

            {/* Circular path */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg
                className="w-[600px] h-[600px]"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="300"
                  cy="300"
                  r="280"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="25%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="75%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                {/* Animated flowing circle */}
                <circle cx="300" cy="20" r="6" fill="#8b5cf6">
                  <animateMotion
                    dur="8s"
                    repeatCount="indefinite"
                    path="M 300,20 A 280,280 0 1,1 299,20"
                  />
                </circle>
              </svg>
            </div>

            {/* Step 1: Data Collection - Top */}
            <div
              className="absolute group"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) translateY(-320px)",
              }}
              data-testid="process-step-1"
            >
              <div className="relative text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 border-4 border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-900/80 rounded-full flex items-center justify-center border-2 border-blue-400">
                    <span className="text-white font-bold text-sm">01</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
                  </div>
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isSpanish ? "Análisis de Datos" : "Data Analysis"}
                </h3>
                <p className="text-sm text-gray-300 max-w-[200px]">
                  {isSpanish
                    ? "Conoce a tu audiencia."
                    : "Understand your audience automatically."}
                </p>
              </div>
            </div>

            {/* Step 2: AI Processing - Top Right */}
            <div
              className="absolute group"
              style={{
                top: "50%",
                left: "50%",
                transform:
                  "translate(-50%, -50%) rotate(72deg) translateY(-320px) rotate(-72deg)",
              }}
              data-testid="process-step-2"
            >
              <div className="relative text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 border-4 border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-purple-900/80 rounded-full flex items-center justify-center border-2 border-purple-400">
                    <span className="text-white font-bold text-sm">02</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isSpanish ? "Creación de Contenido" : "Content Creation"}
                </h3>
                <p className="text-sm text-gray-300 max-w-[200px]">
                  {isSpanish
                    ? "Genera publicaciones, mensajes y campañas."
                    : "Generate posts, messages, and campaigns."}
                </p>
              </div>
            </div>

            {/* Step 3: Auto Deploy - Bottom Right */}
            <div
              className="absolute group"
              style={{
                top: "50%",
                left: "50%",
                transform:
                  "translate(-50%, -50%) rotate(144deg) translateY(-320px) rotate(-144deg)",
              }}
              data-testid="process-step-3"
            >
              <div className="relative text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 border-4 border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-900/80 rounded-full flex items-center justify-center border-2 border-emerald-400">
                    <span className="text-white font-bold text-sm">03</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <div className="w-8 h-4 bg-emerald-500 rounded"></div>
                  </div>
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isSpanish ? "Publicación Automática" : "Automated Posting"}
                </h3>
                <p className="text-sm text-gray-300 max-w-[200px]">
                  {isSpanish
                    ? "Programa y publica tu contenido en múltiples plataformas."
                    : "Publish your content across multiple platforms."}
                </p>
              </div>
            </div>

            {/* Step 4: Conversion - Bottom Left */}
            <div
              className="absolute group"
              style={{
                top: "50%",
                left: "50%",
                transform:
                  "translate(-50%, -50%) rotate(216deg) translateY(-320px) rotate(-216deg)",
              }}
              data-testid="process-step-4"
            >
              <div className="relative text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 border-4 border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-900/80 rounded-full flex items-center justify-center border-2 border-orange-400">
                    <span className="text-white font-bold text-sm">04</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isSpanish ? "Ventas con Chatbot" : "Chatbot Sales"}
                </h3>
                <p className="text-sm text-gray-300 max-w-[200px]">
                  {isSpanish
                    ? "Tu asistente virtual responde y cierra ventas las 24 horas."
                    : "Let the AI chatbot answer questions and close sales 24/7."}
                </p>
              </div>
            </div>

            {/* Step 5: Retention - Top Left */}
            <div
              className="absolute group"
              style={{
                top: "50%",
                left: "50%",
                transform:
                  "translate(-50%, -50%) rotate(288deg) translateY(-320px) rotate(-288deg)",
              }}
              data-testid="process-step-5"
            >
              <div className="relative text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500 border-4 border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-900/80 rounded-full flex items-center justify-center border-2 border-indigo-400">
                    <span className="text-white font-bold text-sm">05</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {isSpanish ? "Retención" : "Retention"}
                </h3>
                <p className="text-sm text-gray-300 max-w-[200px]">
                  {isSpanish
                    ? "Mantén el contacto con tus clientes mediante seguimientos inteligentes."
                    : "Stay connected with your customers."}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Stack */}
          <div className="lg:hidden space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isSpanish
                  ? "Cómo Funciona el Motor IA"
                  : "How The AI Engine Works"}
              </h2>
              <p className="text-gray-300">
                {isSpanish
                  ? "Cinco pasos automatizados que transforman datos en ventas reales"
                  : "Five automated steps that turn data into real sales"}
              </p>
            </div>

            {[
              {
                num: "01",
                title: isSpanish ? "Recopilación" : "Data Collection",
                desc: isSpanish
                  ? "Captura automática desde web, POS y redes"
                  : "Auto-capture from website, POS & social",
                gradient: "from-blue-500 to-cyan-500",
                testId: "process-step-1",
              },
              {
                num: "02",
                title: isSpanish ? "Procesamiento IA" : "AI Processing",
                desc: isSpanish
                  ? "Análisis inteligente y creación"
                  : "Intelligent analysis & creation",
                gradient: "from-purple-500 to-pink-500",
                testId: "process-step-2",
              },
              {
                num: "03",
                title: isSpanish ? "Despliegue Auto" : "Auto Deploy",
                desc: isSpanish
                  ? "Publicación en 21+ plataformas"
                  : "Auto-publish to 21+ platforms",
                gradient: "from-emerald-500 to-teal-500",
                testId: "process-step-3",
              },
              {
                num: "04",
                title: isSpanish ? "Conversión" : "Conversion",
                desc: isSpanish
                  ? "Chatbot IA cierra ventas"
                  : "AI chatbot closes sales",
                gradient: "from-orange-500 to-red-500",
                testId: "process-step-4",
              },
              {
                num: "05",
                title: isSpanish ? "Retención" : "Retention",
                desc: isSpanish
                  ? "Re-targeting inteligente"
                  : "Smart auto-retargeting",
                gradient: "from-indigo-500 to-blue-600",
                testId: "process-step-5",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="relative bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10"
                data-testid={step.testId}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`w-24 h-24 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center shadow-xl relative flex-shrink-0`}
                  >
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center border-2 border-white/30">
                      <span className="text-white font-bold text-xs">
                        {step.num}
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-300">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20">
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>

              <div className="relative text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {isSpanish
                    ? "El Resultado: Más Ventas, Automáticamente"
                    : "The Result: More Sales, Automatically"}
                </h3>
                <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                  {isSpanish
                    ? "Este proceso completo se ejecuta 24/7 sin intervención manual"
                    : "This complete process runs 24/7 without manual work"}
                </p>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-10 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  data-testid="button-process-cta"
                  onClick={() => navigate("/login")}
                >
                  {isSpanish ? "Ver en Acción" : "See It In Action"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet LeadBoost Section */}
      <section
        className="relative pt-40 pb-24"
        style={{ backgroundColor: "#F8F8FA" }}
      >
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
              {isSpanish ? "Conoce Lead Boost" : "Meet Lead Boost"}
            </span>
            <span className="text-gray-900">
              {isSpanish
                ? ", el primer motor de marketing IA integral del mundo: analizando, creando, publicando, convirtiendo y cerrando—todo por ti."
                : ", the world's first end-to-end AI marketing engine: analyzing, creating, posting, converting, and closing—all for you."}
            </span>
          </h2>
        </div>
      </section>

      {/* Meet Boosty - AI Assistant Section */}
      <section
        className="relative py-32 overflow-hidden"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `rgba(59, 130, 246, ${0.1 + Math.random() * 0.15})`,
                animation: `float ${6 + Math.random() * 8}s ease-in-out infinite ${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient orbs - subtle for white background */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-100/30 rounded-full blur-[180px]" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Boosty Video */}
            <div className="relative flex justify-center lg:justify-end order-2 lg:order-1">
              {/* Glow ring behind Boosty */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[450px] sm:h-[450px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300/20 via-blue-300/20 to-purple-300/20 blur-2xl animate-pulse" />
                <div
                  className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-200/15 via-blue-200/15 to-purple-200/15 blur-xl"
                  style={{ animation: "spin 20s linear infinite" }}
                />
                <div
                  className="absolute inset-8 rounded-full border-2 border-blue-200/30"
                  style={{ animation: "spin 30s linear infinite reverse" }}
                />
              </div>

              {/* Floating shadow/platform */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[200px] h-[20px] bg-gray-900/10 rounded-full blur-xl" />

              {/* Boosty Video */}
              <div
                className="relative"
                style={{ animation: "float 6s ease-in-out infinite" }}
              >
                <video
                  src={boostyNewVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[300px] sm:w-[380px] lg:w-[450px] h-auto"
                  style={{
                    filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15))",
                  }}
                  data-testid="boosty-character"
                />
              </div>

              {/* Chat bubbles floating around Boosty - in front of video */}
              <div
                className="absolute top-8 -left-4 sm:left-0 z-20 bg-white backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-2 shadow-xl"
                style={{ animation: "float 5s ease-in-out infinite 0.5s" }}
              >
                <div className="flex items-center gap-2">
                  <SiInstagram className="w-4 h-4 text-pink-500" />
                  <span className="text-gray-800 text-sm font-medium">
                    {isSpanish ? "Post listo!" : "Post ready!"}
                  </span>
                </div>
              </div>

              <div
                className="absolute bottom-1/3 -right-4 sm:-right-8 z-20 bg-white backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-2 shadow-xl"
                style={{ animation: "float 6s ease-in-out infinite 1s" }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-gray-800 text-sm font-medium">
                    +247%
                  </span>
                </div>
              </div>

              <div
                className="absolute top-1/2 -left-8 sm:-left-12 z-20 bg-white backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-2 shadow-xl"
                style={{ animation: "float 7s ease-in-out infinite 1.5s" }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-800 text-sm font-medium">AI</span>
                </div>
              </div>

              {/* Sparkle effects around Boosty - in front */}
              <div className="absolute -top-4 -right-4 z-20 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
              <div
                className="absolute top-1/4 -left-6 z-20 w-2 h-2 bg-blue-500 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="absolute bottom-1/3 -right-8 z-20 w-2 h-2 bg-purple-500 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              />
            </div>

            {/* Right side - Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 mb-8">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-600 text-sm font-semibold tracking-wide uppercase">
                  {isSpanish
                    ? "Tu Asistente IA 24/7"
                    : "Your 24/7 AI Assistant"}
                </span>
              </div>

              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="text-gray-900">
                  {isSpanish ? "Conoce a " : "Meet "}
                </span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Boosty
                </span>
              </h2>

              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed font-light">
                {isSpanish
                  ? "Tu asistente de marketing con inteligencia artificial. Genera contenido, programa publicaciones y gestiona campañas—todo con una simple conversación."
                  : "Your AI-powered marketing assistant. Generate content, schedule posts, and manage campaigns—all with a simple conversation."}
              </p>

              {/* Capabilities grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  {
                    icon: <Bot className="w-5 h-5" />,
                    text: isSpanish
                      ? "Generación de contenido IA"
                      : "AI Content Generation",
                    bgColor: "bg-cyan-500",
                    borderColor: "border-cyan-200",
                    bgLight: "bg-cyan-50",
                  },
                  {
                    icon: <MessageSquare className="w-5 h-5" />,
                    text: isSpanish
                      ? "Interfaz conversacional"
                      : "Conversational Interface",
                    bgColor: "bg-blue-500",
                    borderColor: "border-blue-200",
                    bgLight: "bg-blue-50",
                  },
                  {
                    icon: <Clock className="w-5 h-5" />,
                    text: isSpanish
                      ? "Programación automática"
                      : "Auto Scheduling",
                    bgColor: "bg-purple-500",
                    borderColor: "border-purple-200",
                    bgLight: "bg-purple-50",
                  },
                  {
                    icon: <BarChart3 className="w-5 h-5" />,
                    text: isSpanish
                      ? "Análisis inteligente"
                      : "Smart Analytics",
                    bgColor: "bg-pink-500",
                    borderColor: "border-pink-200",
                    bgLight: "bg-pink-50",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl ${item.bgLight} border ${item.borderColor} hover:shadow-md transition-all duration-300 group`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center text-white shadow-lg`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                  data-testid="button-chat-boosty"
                >
                  {isSpanish ? "Chatear con Boosty" : "Chat with Boosty"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-semibold px-8 py-6 text-lg rounded-xl transition-all duration-300"
                  onClick={() => navigate("/login")}
                >
                  {isSpanish ? "Ver demostración" : "Watch Demo"}
                  <Play className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-gray-500">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {isSpanish ? "Sin tarjeta requerida" : "No credit card"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {isSpanish ? "14 días gratis" : "14 days free"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boosty capabilities showcase */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🎨",
                title: isSpanish ? "Creación de Contenido" : "Content Creation",
                desc: isSpanish
                  ? "Genera posts, stories, reels y más para todas tus redes sociales en segundos."
                  : "Generate posts, stories, reels and more for all your social networks in seconds.",
                gradient: "from-pink-50 to-rose-50",
                border: "border-pink-200",
                textColor: "text-gray-900",
                descColor: "text-gray-600",
              },
              {
                emoji: "📅",
                title: isSpanish ? "Planificación 30 Días" : "30-Day Planner",
                desc: isSpanish
                  ? "Planifica y programa un mes completo de contenido con estrategia inteligente."
                  : "Plan and schedule a full month of content with intelligent strategy.",
                gradient: "from-blue-50 to-cyan-50",
                border: "border-blue-200",
                textColor: "text-gray-900",
                descColor: "text-gray-600",
              },
              {
                emoji: "🚀",
                title: isSpanish
                  ? "Optimización Automática"
                  : "Auto Optimization",
                desc: isSpanish
                  ? "Analiza rendimiento y mejora automáticamente tus campañas en tiempo real."
                  : "Analyze performance and automatically improve your campaigns in real-time.",
                gradient: "from-purple-50 to-indigo-50",
                border: "border-purple-200",
                textColor: "text-gray-900",
                descColor: "text-gray-600",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} border ${item.border} p-8 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group`}
              >
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3
                  className={`text-xl font-bold ${item.textColor} mb-3 group-hover:text-blue-600 transition-colors`}
                >
                  {item.title}
                </h3>
                <p className={`${item.descColor} leading-relaxed`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CSS for spin animation */}
        <style>{`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
      </section>

      {/* Interactive Demo Section - Premium Style */}
      <section className="relative py-32 bg-gradient-to-b from-blue-50/30 via-white to-slate-50/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Demo Container with Premium Styling */}
          <div
            className="backdrop-blur-sm border border-white/50 rounded-3xl shadow-2xl p-8 lg:p-12"
            style={{ backgroundColor: "rgba(248, 248, 250, 0.8)" }}
          >
            <InteractiveDemo isSpanish={isSpanish} />
          </div>
        </div>
      </section>

      {/* Features Section - Squarespace Style */}
      <section
        className="relative py-32 bg-gradient-to-b via-slate-50/30"
        style={{ backgroundColor: "#F8F8FA" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-b from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
              {isSpanish
                ? "Todo Lo Que Necesitas Para Vender Más"
                : "Everything You Need To Sell More"}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
              {isSpanish
                ? "Una plataforma completa que automatiza tu marketing y ventas mientras tú te enfocas en hacer crecer tu negocio."
                : "A complete platform that automates your marketing and sales while you focus on growing your business."}
            </p>
          </div>

          {/* Modern Bento-Style Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Primary Feature - Large Card */}
            <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
                    <span className="text-blue-300 text-sm font-medium">
                      AI-POWERED
                    </span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {isSpanish
                    ? "Generador de Contenido Inteligente"
                    : "Smart Content Generator"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  {isSpanish
                    ? "IA crea y publica contenido de marketing basado en datos reales de tu negocio - inventario, ventas, eventos."
                    : "Effortlessly collect and centralize valuable insights from your website, POS systems, and social media channels — all in one place."}
                </p>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>
                    {isSpanish
                      ? "Generando contenido..."
                      : "Generating content..."}
                  </span>
                </div>
              </div>
            </div>

            {/* High-Converting Chatbot Card - Top Right */}
            <div className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-gray-900 via-rose-900 to-pink-900 rounded-2xl p-6 border border-rose-500/20 hover:border-rose-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/25">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-rose-500/20 rounded-full border border-rose-400/30">
                      <span className="text-rose-300 text-xs font-bold">
                        HIGH-CONVERTING
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
                    <div className="text-rose-300 text-xs font-mono">
                      Online
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-rose-300 transition-colors duration-300">
                  {isSpanish ? "ChatBot de Ventas IA" : "AI Sales Chatbot"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm mb-4">
                  {isSpanish
                    ? "ChatBot inteligente que convierte visitantes en clientes con respuestas personalizadas y seguimiento automático de leads."
                    : "Intelligent chatbot that converts visitors into customers with personalized responses and automatic lead follow-up."}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-rose-300">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {isSpanish ? "85% conversión" : "85% conversion"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-300">
                    <Clock className="w-3 h-3" />
                    <span>{isSpanish ? "24/7 activo" : "24/7 active"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inbox Card - Middle Left */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-green-900 rounded-2xl p-6 border border-green-500/20 hover:border-green-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-green-300 transition-colors duration-300">
                  {isSpanish ? "Bandeja Unificada" : "Unified Inbox"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {isSpanish
                    ? "Gestiona todos los mensajes desde un solo lugar con respuestas automáticas."
                    : "Manage all messages from one place with automatic responses."}
                </p>
              </div>
            </div>

            {/* Platforms Card - Middle Right */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-orange-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-orange-300 text-xs font-bold px-2 py-1 bg-orange-500/20 rounded-full border border-orange-400/30">
                    21+
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-300 transition-colors duration-300">
                  {isSpanish ? "Plataformas Conectadas" : "Connected Platforms"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {isSpanish
                    ? "Publica automáticamente en Instagram, Facebook, TikTok, LinkedIn y más."
                    : "Automatically post to Instagram, Facebook, TikTok, LinkedIn and more."}
                </p>
              </div>
            </div>

            {/* CRM Card - Bottom Left */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-red-900 rounded-2xl p-6 border border-red-500/20 hover:border-red-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/25">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-red-300 text-xs font-mono">
                    {"<CRM/>"}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-red-300 transition-colors duration-300">
                  {isSpanish ? "CRM Inteligente" : "Smart CRM"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {isSpanish
                    ? "Gestión automática de leads con seguimiento inteligente y nurturing personalizado."
                    : "Automatic lead management with intelligent tracking and personalized nurturing."}
                </p>
              </div>
            </div>

            {/* Analytics Card - Bottom Featured */}
            <div className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <div
                      className="w-1 h-8 bg-purple-400 rounded animate-pulse"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="w-1 h-6 bg-purple-500 rounded animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-10 bg-purple-400 rounded animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1 h-4 bg-purple-500 rounded animate-pulse"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                  {isSpanish
                    ? "Análisis en Tiempo Real"
                    : "Real-Time Analytics"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {isSpanish
                    ? "Dashboard con métricas de ventas, engagement y ROI para optimizar tu estrategia automáticamente."
                    : "Dashboard with sales, engagement and ROI metrics to optimize your strategy automatically."}
                </p>
              </div>
            </div>

            {/* Security Card - Next to Analytics */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-cyan-900 rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
                    <div
                      className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                  {isSpanish ? "Seguridad Empresarial" : "Enterprise Security"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {isSpanish
                    ? "Cifrado de extremo a extremo, cumplimiento GDPR y backups automáticos."
                    : "End-to-end encryption, GDPR compliance and automatic backups."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Premium Style */}
      <section className="relative py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
            {isSpanish
              ? "¿Listo Para Hacer Crecer Tus Ventas?"
              : "Ready To Grow Your Sales?"}
          </h2>
          <p className="text-xl sm:text-2xl text-gray-300/90 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            {isSpanish
              ? "Únete a miles de empresas que ya están creciendo en piloto automático. Sin configuración complicada, sin contratos largos."
              : "Join thousands of businesses already growing on autopilot. No complex setup, no long contracts."}
          </p>

          <div className="flex flex-col items-center gap-6 mb-12">
            <Button
              className="text-gray-900 hover:opacity-80 font-bold px-16 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
              style={{ backgroundColor: "#F8F8FA" }}
              data-testid="button-start-free-trial-final"
              onClick={() => navigate("/login")}
            >
              {isSpanish ? "Comenzar Gratis Ahora" : "Start Free Now"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-400 text-sm">
              {isSpanish
                ? "Prueba gratis 14 días • No se requiere tarjeta de crédito • Cancela cuando quieras"
                : "14-day free trial • No credit card required • Cancel anytime"}
            </p>
          </div>

          <div className="flex justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isSpanish ? "Seguro SSL" : "SSL Secure"}
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {isSpanish ? "GDPR Compliant" : "GDPR Compliant"}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {isSpanish ? "Soporte 24/7" : "24/7 Support"}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img
                src={leadBoostLogo}
                alt="LeadBoost"
                className="h-8 w-auto brightness-150 mr-4"
              />
              <span className="text-white/60 text-sm">
                {isSpanish
                  ? "© 2025 Lead Boost. Todos los derechos reservados."
                  : "© 2025 Lead Boost. All rights reserved."}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              {/* Trustpilot Reviews */}
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-green-400 fill-current"
                    />
                  ))}
                </div>
                <span className="text-sm">
                  {isSpanish
                    ? "4.8/5 · 2,500+ reseñas"
                    : "4.8/5 · 2,500+ reviews"}
                </span>
                <Button
                  variant="ghost"
                  className="text-white/60 hover:text-white text-xs p-0 underline"
                >
                  Trustpilot
                </Button>
              </div>

              <Button
                variant="ghost"
                className="text-white/60 hover:text-white text-sm"
                onClick={() => navigate("/privacy-policy")}
                data-testid="link-privacy-policy"
              >
                {isSpanish ? "Privacidad" : "Privacy"}
              </Button>
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white text-sm"
              >
                {isSpanish ? "Términos" : "Terms"}
              </Button>
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white text-sm"
              >
                {isSpanish ? "Soporte" : "Support"}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
