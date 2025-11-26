import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Zap, Image as ImageIcon, Mic } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import ContentCalendar from "@/pages/calendar";
import boosty from "./boosty.png";
import boosty_face from "./boosty_face.png";

export default function CampAIgner() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: `Initial Content Generation Complete. I have successfully drafted an optimal Instagram post for scheduling **tomorrow at 10:00 AM**. Review the creative output below:

------------------------------------------------------------------

[PREVIEW: INSTAGRAM POST]

PROFILE: @your_brand_success
CREATIVE: CAPTION: Leverage AI for superior campaign performance. Boosty drives maximum ROI and measurable growth. #AICampaign #DigitalStrategy #BoostyAI

TARGET SCHEDULE: Tomorrow, 10:00 AM.

------------------------------------------------------------------

To confirm and execute the scheduling action, please input: **"thank you post it"**`,
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    setInput("");

    // Simulated AI reply
    setTimeout(() => {
      let assistantResponse = "";

      // Logic for the demo: Post Scheduling Confirmation
      if (userInput.toLowerCase() === "thank you post it") {
        assistantResponse =
          "Action Confirmed. The content asset has been moved to the scheduling queue. **The post is being scheduled** for tomorrow at 10:00 AM PST. Confirmation will be visible in the '30-Day Planner' module shortly. 🚀";
      } else {
        // Default professional response
        assistantResponse = `Processing request: '${userInput}'. Based on current data streams, I recommend a cross-platform engagement strategy focused on Instagram Stories and TikTok for Q4 optimization. Preliminary Budget Projection: $300/week.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantResponse,
        },
      ]);
    }, 1200);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    "Generate a comprehensive Q4 social media strategy report",
    "Analyze competitor performance data (top 3 trends)",
    "Draft email sequences for abandoned cart recovery",
    "Develop a LinkedIn strategy for B2B lead generation",
    "Model a 7-day high-conversion posting calendar",
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
            <Tabs
              defaultValue="campaigns"
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="campaigns"
                  className="flex items-center data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0891b2] data-[state=active]:to-[hsl(210,70%,45%)]"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Strategize with Boosty
                </TabsTrigger>
                <TabsTrigger value="planner" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  30-Day Content Planner
                </TabsTrigger>
              </TabsList>

              {/* Campaign Editor */}
              <TabsContent
                value="campaigns"
                className="flex-1 flex flex-col h-full"
              >
                {/* Chat area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <img
                          src={boosty_face}
                          alt="Boosty"
                          className="w-10 h-10 rounded-full shadow-sm"
                        />
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input + Suggestions */}
                <div className="border-t bg-white">
                  <div className="p-4 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100 rounded-full"
                    >
                      <ImageIcon className="h-5 w-5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100 rounded-full"
                    >
                      <Mic className="h-5 w-5 text-gray-500" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Formulate your request or campaign directive..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="w-full rounded-full border-gray-300 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSend}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition"
                      >
                        <Zap className="h-4 w-4 inline-block text-blue-500 mr-2" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
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
                💡 Need high-level strategy input?
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
