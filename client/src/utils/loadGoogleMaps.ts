export function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, no lo cargues de nuevo
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      return;
    }

    // Crea el script dinámicamente
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&v=weekly&language=es&region=MX`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Error loading Google Maps"));
    document.head.appendChild(script);
  });
}
