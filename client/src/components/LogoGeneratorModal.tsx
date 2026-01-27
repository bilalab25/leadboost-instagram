import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, RefreshCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface LogoModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (logoDataUrl: string) => void;
}

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  logoUri?: { base64?: string; mimeType?: string };
  error?: string;
}

const LogoGeneratorModal = ({
  brandId,
  isOpen,
  onClose,
  onAccept,
}: LogoModalProps) => {
  const { isSpanish } = useLanguage();
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const maxGenerations = 3;

  const pollJobStatus = useCallback(async (jobId: string): Promise<JobStatus | null> => {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/logo-generator/status/${jobId}`);
        if (!response.ok) throw new Error("Failed to get job status");
        
        const job: JobStatus = await response.json();
        
        if (job.status === "completed") {
          return job;
        } else if (job.status === "failed") {
          throw new Error(job.error || (isSpanish ? "Error al generar logo" : "Failed to generate logo"));
        }
        
        setStatusMessage(
          isSpanish 
            ? `Generando logo... (${attempt + 1}s)` 
            : `Generating logo... (${attempt + 1}s)`
        );
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (err) {
        throw err;
      }
    }
    
    throw new Error(isSpanish ? "Tiempo de espera agotado" : "Generation timed out");
  }, [isSpanish]);

  const generateLogo = useCallback(async () => {
    if (generationCount >= maxGenerations) {
      setError(
        isSpanish 
          ? "Has alcanzado el límite de 3 generaciones" 
          : "You've reached the limit of 3 generations"
      );
      return;
    }

    setLoading(true);
    setError(null);
    setLogoDataUrl(null);
    setStatusMessage(isSpanish ? "Iniciando generación..." : "Starting generation...");

    try {
      const response = await fetch(`/api/logo-generator/${brandId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(isSpanish ? "Error al iniciar generación" : "Failed to start generation");
      }

      const data = await response.json();
      const jobId = data.jobId;

      if (!jobId) {
        throw new Error(isSpanish ? "No se recibió ID del trabajo" : "No job ID received");
      }

      const completedJob = await pollJobStatus(jobId);
      
      if (completedJob?.logoUri?.base64 && completedJob?.logoUri?.mimeType) {
        const dataUrl = `data:${completedJob.logoUri.mimeType};base64,${completedJob.logoUri.base64}`;
        setLogoDataUrl(dataUrl);
        setGenerationCount(prev => prev + 1);
        setStatusMessage("");
      } else {
        throw new Error(isSpanish ? "Logo generado sin datos" : "Logo generated without data");
      }
    } catch (err) {
      console.error("Error generating logo:", err);
      setError(err instanceof Error ? err.message : (isSpanish ? "Error desconocido" : "Unknown error"));
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  }, [brandId, generationCount, isSpanish, pollJobStatus]);

  useEffect(() => {
    if (isOpen && generationCount === 0) {
      generateLogo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setLogoDataUrl(null);
      setGenerationCount(0);
      setError(null);
      setStatusMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {isSpanish ? "Generador de Logo IA" : "AI Logo Generator"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-blue-100 dark:border-blue-900" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-center animate-pulse">
                {statusMessage || (isSpanish ? "Generando logo..." : "Generating logo...")}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                {isSpanish 
                  ? "Esto puede tomar hasta 2 minutos" 
                  : "This may take up to 2 minutes"}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {logoDataUrl && !loading && (
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
                <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                  <img
                    src={logoDataUrl}
                    alt="Generated Logo"
                    className="max-h-56 max-w-full object-contain"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {isSpanish ? "Generación" : "Generation"} {generationCount} / {maxGenerations}
              </p>
            </div>
          )}

          {!loading && !logoDataUrl && !error && (
            <div className="flex flex-col items-center py-8">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                <Sparkles className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {isSpanish 
                  ? "Haz clic en generar para crear tu logo" 
                  : "Click generate to create your logo"}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <Button
              onClick={generateLogo}
              disabled={generationCount >= maxGenerations || loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {generationCount >= maxGenerations 
                ? (isSpanish ? "Límite alcanzado" : "Limit reached")
                : (isSpanish ? "Regenerar" : "Regenerate")}
            </Button>

            <Button
              onClick={() => {
                if (logoDataUrl) onAccept(logoDataUrl);
                onClose();
              }}
              disabled={!logoDataUrl || loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {isSpanish ? "Aceptar Logo" : "Accept Logo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoGeneratorModal;
