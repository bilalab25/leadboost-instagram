import React, { useState, useEffect } from "react";
import axios from "axios";

interface LogoModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (logoUri: string) => void;
}

const LogoGeneratorModal: React.FC<LogoModalProps> = ({
  brandId,
  isOpen,
  onClose,
  onAccept,
}) => {
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const maxGenerations = 3;

  // Función para generar logo
  const generateLogo = async () => {
    if (generationCount >= maxGenerations) {
      setError("You can only generate a logo 3 times.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/logo-generator/${brandId}`);
      // Asumimos que el backend devuelve directamente la URI/base64 del logo
      const logo = response.data.logoUri;
      setLogoUri(logo);
      setGenerationCount((prev) => prev + 1);
    } catch (err) {
      console.error("Error generating logo:", err);
      setError("Failed to generate logo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generar logo automáticamente al abrir el modal
  useEffect(() => {
    if (isOpen) {
      generateLogo();
    } else {
      setLogoUri(null);
      setGenerationCount(0);
      setError(null);
    }
  }, [isOpen]);

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Generate Your Logo
        </h2>

        {loading && (
          <p className="text-center text-gray-500">Generating logo...</p>
        )}

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}

        {logoUri && !loading && (
          <div className="flex flex-col items-center mb-4">
            <img
              src={logoUri}
              alt="Generated Logo"
              className="max-h-48 object-contain mb-2"
            />
            <p className="text-sm text-gray-600">
              Generation {generationCount} / {maxGenerations}
            </p>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={generateLogo}
            disabled={generationCount >= maxGenerations || loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow disabled:opacity-50"
          >
            {generationCount >= maxGenerations ? "Max reached" : "Regenerate"}
          </button>

          <button
            onClick={() => {
              if (logoUri) onAccept(logoUri);
              onClose();
            }}
            disabled={!logoUri}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow disabled:opacity-50"
          >
            Accept Logo
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;
};

export default LogoGeneratorModal;
