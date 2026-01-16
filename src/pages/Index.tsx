import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { DocumentInput } from "@/components/DocumentInput";
import { EmptyState } from "@/components/EmptyState";
import { TypingIndicator } from "@/components/TypingIndicator";
import { FileText } from "lucide-react";

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

    // Simulate AI response - replace with actual RAG backend call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Demo response - in production, this comes from your RAG backend
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getDemoResponse(content),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
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

// Demo responses - replace with actual RAG backend
function getDemoResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("summarize") || lowerQuery.includes("main points")) {
    return "The document covers three main areas: project objectives, implementation timeline, and resource allocation. Key findings indicate a 23% improvement in efficiency metrics compared to baseline measurements (Section 2.1). The proposed methodology follows industry best practices as outlined in the appendix (Section 4.3).";
  }

  if (lowerQuery.includes("finding") || lowerQuery.includes("result")) {
    return "The key findings are: (1) User engagement increased by 45% after implementation (Section 3.2), (2) Cost reduction of approximately $12,000 monthly (Section 3.4), and (3) Customer satisfaction scores improved from 3.2 to 4.1 on a 5-point scale (Section 3.5).";
  }

  if (lowerQuery.includes("section")) {
    return "Section 2 details the methodology used in this analysis. It describes the data collection process spanning Q1-Q3 2024, the statistical methods applied (regression analysis and cohort comparison), and the validation criteria used to ensure data integrity (Section 2.1-2.3).";
  }

  return "Based on the document content, the information relates to project planning and execution phases. The document emphasizes stakeholder alignment and iterative feedback loops as critical success factors (Section 1.2). For more specific details, please ask about a particular section or topic.";
}

export default Index;
