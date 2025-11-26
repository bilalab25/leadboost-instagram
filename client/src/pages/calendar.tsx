import { useState, useRef, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Zap, Image as ImageIcon, Mic } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import ContentCalendar from "@/pages/calendar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import boosty from "./boosty.png";
import boosty_face from "./boosty_face.png";

export default function Waterfall() {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
      imagePreview?: string;
    }[]
  >([
    {
      role: "assistant",
      content:
        "Welcome! I’m Boosty, your AI-powered marketing strategist 🚀. I’m here to help you design strategies, create content, and launch posts that grow your brand. Would you like me to walk you through your first campaign this month?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [postGenerated, setPostGenerated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const typeText = useCallback(
    async (fullText: string, messageIndex: number) => {
      for (let i = 0; i < fullText.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[messageIndex]) {
            copy[messageIndex].content = fullText.slice(0, i + 1);
          }
          return copy;
        });
      }
      setIsTyping(false);

      if (fullText.includes("Content Generation Complete.")) {
        setPostGenerated(true);
      }
    },
    [],
  );

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setInput("");

    setTimeout(() => {
      let assistantResponse = "";
      const lowerInput = userInput.toLowerCase();
      let imagePreview: string | undefined = undefined;

      if (postGenerated && lowerInput.includes("thank you post it")) {
        assistantResponse =
          "**Action Confirmed.** The content asset has been moved to the scheduling queue. **The post is being scheduled** for tomorrow at 11:00 AM PST. 🚀";
        setPostGenerated(false);
      } else if (
        !postGenerated &&
        lowerInput.includes("generate post for tomorrow for instagram")
      ) {
        assistantResponse = `
**Content Generation Complete.**
I have successfully drafted an optimal Instagram post for scheduling **tomorrow at 11:00 AM**.  

Here is the caption that will accompany your selected media:

---

### ✨ GLOWING SKIN FACIAL  
Unveil your natural radiance.

Experience deep hydration, rejuvenation, and a flawless complexion with our signature facial treatment.

**Ready for your glow up?**  
BOOK NOW via the link in our bio!

#RenuveAestheticsBar #GlowingSkin #FacialTreatment #NaturalRadiance #SkincareGoals

**TARGET SCHEDULE:** Tomorrow, 11:00 AM.

---

To confirm and execute the scheduling action, type: **"thank you post it"**
        `;

        imagePreview =
          "https://res.cloudinary.com/dgujs7cy9/image/upload/v1764131141/Gemini_Generated_Image_loy3jsloy3jsloy3_yucbls.png";
      } else {
        assistantResponse = `Processing request: **${userInput}**…  
Based on current signals, I recommend a cross-platform engagement strategy focusing on Instagram Stories + TikTok for Q4 performance.`;
      }

      // Add assistant message with optional image
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          imagePreview,
        },
      ]);

      setIsTyping(true);

      setTimeout(() => {
        setMessages((prev) => {
          const messageIndex = prev.length - 1;
          typeText(assistantResponse, messageIndex);
          return prev;
        });
      }, 100);
    }, 800);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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

              <TabsContent
                value="campaigns"
                className="flex-1 flex flex-col h-full"
              >
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
                        className={`px-4 py-3 max-w-[75%] text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-2xl rounded-br-none shadow-md"
                            : "bg-white text-gray-900 rounded-2xl rounded-bl-none shadow-sm border border-gray-200"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>

                            {msg.imagePreview && (
                              <img
                                src={msg.imagePreview}
                                alt="Preview"
                                className="mt-3 rounded-lg border shadow-sm max-w-full"
                              />
                            )}
                          </>
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {msg.content}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t bg-white">
                  {isTyping && (
                    <div className="flex items-center gap-2 px-6 pt-4">
                      <img
                        src={boosty_face}
                        alt="Boosty"
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                      <span className="text-xs text-gray-400 ml-1">
                        Boosty is typing...
                      </span>
                    </div>
                  )}

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
                        disabled={isTyping}
                      />
                      <button
                        onClick={handleSend}
                        disabled={isTyping}
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
                        disabled={isTyping}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition"
                      >
                        <Zap className="h-4 w-4 inline-block text-blue-500 mr-2" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="planner" className="h-full">
                <ContentCalendar />
              </TabsContent>
            </Tabs>

            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
              <div className="bg-white shadow-lg px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
                💡 Need high-level strategy input?
              </div>
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
