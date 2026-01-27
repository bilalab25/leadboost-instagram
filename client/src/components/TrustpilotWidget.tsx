import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement, reload?: boolean) => void;
    };
  }
}

interface TrustpilotWidgetProps {
  className?: string;
  theme?: "light" | "dark";
  height?: string;
  width?: string;
}

export function TrustpilotWidget({
  className = "",
  theme = "light",
  height = "28px",
  width = "100%",
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className}`}
      data-locale="en-US"
      data-template-id="5419b6a8b0d04a076446a9ad"
      data-businessunit-id="WBNxhT4illY9GnZA"
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
      data-min-review-count="0"
      data-style-alignment="center"
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

export function TrustpilotMicroStar({
  className = "",
  theme = "light",
}: {
  className?: string;
  theme?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className}`}
      data-locale="en-US"
      data-template-id="5406e65db0d04a09e042d5fc"
      data-businessunit-id="WBNxhT4illY9GnZA"
      data-style-height="28px"
      data-style-width="100%"
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
