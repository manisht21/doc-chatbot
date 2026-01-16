import { FileText, MessageSquare, Quote } from "lucide-react";

interface EmptyStateProps {
  isDocumentConnected: boolean;
}

export function EmptyState({ isDocumentConnected }: EmptyStateProps) {
  if (!isDocumentConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <FileText className="h-8 w-8 text-secondary-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Connect a Document
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Paste a Google Doc URL above to start asking questions about its content.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1">
            Instant answers
          </span>
          <span className="rounded-full bg-secondary px-3 py-1">
            Source citations
          </span>
          <span className="rounded-full bg-secondary px-3 py-1">
            Context-aware
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <MessageSquare className="h-8 w-8 text-accent-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Document Connected
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ask any question about the document. I'll answer based strictly on its content with proper citations.
        </p>
      </div>
      <div className="space-y-2 max-w-md">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Try asking
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Summarize the main points",
            "What are the key findings?",
            "Explain section 2",
          ].map((q) => (
            <span
              key={q}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"
            >
              <Quote className="h-3 w-3" />
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
