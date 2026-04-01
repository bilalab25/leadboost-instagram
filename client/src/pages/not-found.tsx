import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function NotFound() {
  const { isSpanish } = useLanguage();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{isSpanish ? '404 Página No Encontrada' : '404 Page Not Found'}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {isSpanish
              ? 'La página que buscas no existe o fue movida.'
              : 'The page you are looking for does not exist or has been moved.'}
          </p>
          <a href="/dashboard" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">
            {isSpanish ? '← Volver al Dashboard' : '← Back to Dashboard'}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
