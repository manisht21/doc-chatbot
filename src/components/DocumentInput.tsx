import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Check, AlertCircle } from "lucide-react";

interface DocumentInputProps {
  onConnect: (url: string) => void;
  isConnected: boolean;
  isLoading?: boolean;
  error?: string;
}

export function DocumentInput({ onConnect, isConnected, isLoading, error }: DocumentInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConnect(url.trim());
    }
  };

  const isValidUrl = url.includes("docs.google.com") || url.includes("drive.google.com");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Google Doc URL..."
            disabled={isConnected || isLoading}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || !isValidUrl || isConnected || isLoading}
          variant={isConnected ? "secondary" : "default"}
          className="shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Connecting
            </span>
          ) : isConnected ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Connected
            </span>
          ) : (
            "Connect"
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {url && !isValidUrl && (
        <p className="text-xs text-muted-foreground">
          Please enter a valid Google Docs or Drive URL
        </p>
      )}
    </form>
  );
}
