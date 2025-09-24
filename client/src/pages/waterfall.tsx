import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Zap, Image as ImageIcon, Mic } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import ContentCalendar from "@/pages/calendar";
import boosty from "./boosty.png";

export default function CampAIgner() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "👋 Hi there! I’m your AI assistant. Tell me about your campaign idea and I’ll help you generate strategies, content, and ads 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    // Simulated AI reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✨ Got it! Here's a campaign suggestion: Instagram Stories ads with engaging polls, linked to your landing page. Suggested budget: $300/week.",
        },
      ]);
    }, 1200);

    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    "Give me ideas for a social media campaign",
    "Generate a slogan for a health campaign",
    "Create an email marketing plan for e-commerce",
    "Suggest TikTok content for fashion",
    "Generate a 7-day posting calendar",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Meet CampAIgner" />

      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        {" "}
        {/* full height minus header */}
        <Sidebar />
        <div className="flex-1">
          <main className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
            <Tabs defaultValue="campaigns" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="campaigns" className="flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  Campaign Editor
                </TabsTrigger>
                <TabsTrigger value="planner" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  30-Day Planner
                </TabsTrigger>
              </TabsList>

              {/* Campaign Editor */}
              <TabsContent value="campaigns" className="h-[calc(100%-48px)]">
                <Card className="flex flex-col h-full shadow-lg">
                  {/* Header */}
                  <div className="text-center p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Mr.CampAIgner
                    </h1>
                    <p className="text-gray-700 mt-2">
                      Start creating campaigns with{" "}
                      <span className="text-blue-600 font-semibold">
                        LeadBoost AI
                      </span>
                    </p>
                    <p className="text-gray-500 mt-1 text-sm">
                      Your marketing assistant that transforms ideas into
                      ready-to-launch campaigns.
                    </p>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "ml-auto bg-blue-500 text-white max-w-[75%]"
                            : "mr-auto bg-gray-200 text-gray-900 max-w-[85%]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggestions */}
                  <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestions.map((s, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="justify-start text-gray-700 hover:bg-blue-50"
                        onClick={() => setInput(s)}
                      >
                        <Zap className="h-4 w-4 mr-2 text-blue-500" /> {s}
                      </Button>
                    ))}
                  </div>

                  {/* Input fixed at bottom */}
                  <div className="p-4 border-t bg-white flex items-center gap-3">
                    {/* File/Image button */}
                    <Button variant="outline" size="icon">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </Button>

                    {/* Audio button */}
                    <Button variant="outline" size="icon">
                      <Mic className="h-5 w-5 text-gray-600" />
                    </Button>

                    {/* Text input */}
                    <Input
                      placeholder="Type your campaign idea..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1 text-lg"
                    />

                    {/* Send button */}
                    <Button
                      onClick={handleSend}
                      className="bg-blue-600 text-white"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Planner */}
              <TabsContent value="planner" className="h-full">
                <ContentCalendar />
              </TabsContent>
            </Tabs>
            {/* Mascot floating helper */}
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
              {/* Speech bubble */}
              <div className="bg-white shadow-lg px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
                💡 Need campaign ideas?
              </div>
              {/* Mascot */}
              <img
                src={boosty}
                alt="LeadBoost Assistant"
                className="w-36 h-48 cursor-pointer hover:scale-105 transition-transform"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
