import { FileText } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <FileText className="h-4 w-4 text-secondary-foreground" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot"
          style={{ animationDelay: "400ms" }}
        />
      </div>
    </div>
  );
}
