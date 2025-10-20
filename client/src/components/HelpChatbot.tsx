import { Link } from "wouter";
import boosty from "./boosty.png";

interface HelpChatbotProps {
  mascot?: string;
}

export default function HelpChatbot({ mascot }: HelpChatbotProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Globito */}
      <div className="bg-white shadow-md px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
        👋 Need help?
      </div>
      {/* Mascota */}
      <Link to="/waterfall">
        <img
          src={mascot || boosty}
          alt="LeadBoost Assistant"
          className="w-36 h-48 hover:scale-110 transition-transform cursor-pointer"
        />
      </Link>
    </div>
  );
}
