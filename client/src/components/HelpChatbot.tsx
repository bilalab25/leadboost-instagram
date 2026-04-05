import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

const boosty = "/images/boosty_sidebar.png";

interface HelpChatbotProps {
  mascot?: string;
  isSpanish?: boolean;
  toggleLanguage?: () => void;
  [key: string]: any;
}

export default function HelpChatbot({ mascot }: HelpChatbotProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1 pointer-events-none">
      {!minimized ? (
        <>
          <button
            onClick={() => setMinimized(true)}
            className="pointer-events-auto bg-white shadow-sm p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors self-end mr-1"
            aria-label="Minimize assistant"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="pointer-events-auto bg-white shadow-md px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
            👋 Need help?
          </div>
          <Link to="/waterfall" className="pointer-events-auto">
            <img
              src={mascot || boosty}
              alt="LeadBoost Assistant"
              className="w-28 h-36 hover:scale-105 transition-transform cursor-pointer"
            />
          </Link>
        </>
      ) : (
        <button
          onClick={() => setMinimized(false)}
          className="pointer-events-auto bg-white shadow-md border border-gray-200 rounded-full p-2.5 hover:shadow-lg transition-shadow flex items-center gap-1.5 text-sm text-gray-600"
          aria-label="Show assistant"
        >
          <img
            src={mascot || boosty}
            alt="LeadBoost Assistant"
            className="w-8 h-8 rounded-full object-cover"
          />
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
