import { useEffect, useRef } from "react";

interface TrustpilotWidgetProps {
  className?: string;
  theme?: "light" | "dark";
  locale?: string;
  height?: string;
  width?: string;
}

export default function TrustpilotWidget({
  className = "",
  theme = "light",
  locale = "en-US",
  height = "28px",
  width = "100%",
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Avoid loading the script multiple times
    if (!document.getElementById("trustpilot-script")) {
      const script = document.createElement("script");
      script.src =
        "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
      script.id = "trustpilot-script";
      script.async = true;
      document.body.appendChild(script);
    }
    return () => {
      // Cleanup script on unmount
      const script = document.getElementById("trustpilot-script");
      if (script) script.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className}`}
      data-locale={locale}
      data-template-id="5406e65db0d04a09e042d5fc"
      data-businessunit-id="WBNxhT4illY9GnZA"
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
    >
      <a
        href="https://www.trustpilot.com/review/leadboostio.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
