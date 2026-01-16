import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { DocumentInput } from "@/components/DocumentInput";
import { EmptyState } from "@/components/EmptyState";
import { TypingIndicator } from "@/components/TypingIndicator";
import { FileText, Trash2 } from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDocumentConnected, setIsDocumentConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleConnect = async (url: string) => {
    setIsConnecting(true);
    setConnectionError("");
    setDocumentUrl(url);

    // Simulate connection - replace with actual backend call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo purposes, we'll simulate a successful connection
    // In production, this would call your RAG backend
    setIsDocumentConnected(true);
    setIsConnecting(false);
  };

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamChat({
      question: content,
      documentUrl,
      conversationHistory,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => {
        setIsLoading(false);
      },
      onError: (error) => {
        setIsLoading(false);
        toast.error(error);
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Document Assistant
                </h1>
                <p className="text-xs text-muted-foreground">
                  RAG-powered document Q&A
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <DocumentInput
            onConnect={handleConnect}
            isConnected={isDocumentConnected}
            isLoading={isConnecting}
            error={connectionError}
          />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState isDocumentConnected={isDocumentConnected} />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <ChatInput
            onSend={handleSend}
            disabled={!isDocumentConnected || isLoading}
            placeholder={
              isDocumentConnected
                ? "Ask a question about the document..."
                : "Connect a document first..."
            }
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Answers are based strictly on document content with citations
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
