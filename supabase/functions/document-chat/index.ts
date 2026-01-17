import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  documentUrl: string;
  conversationHistory: Message[];
}

const SYSTEM_PROMPT = `You are an AI-powered document assistant that answers user questions strictly based on the content retrieved from a Google Document.

CORE RULES:
1. Use ONLY the provided document context when answering.
2. If the answer is not present in the document, respond exactly with: "This info isn't in the document."
3. NEVER use external knowledge or assumptions.
4. Always provide concise, professional answers.

CITATION REQUIREMENTS:
- Every factual statement MUST include inline citations.
- Use the format: (Section X.Y) or (Page X) based on document structure.
- If multiple sections are used, cite all relevant sections.

CONVERSATION HANDLING:
- Maintain context from the conversation history provided.
- If a user follow-up depends on prior context, resolve it correctly.
- Do NOT repeat previous answers unless explicitly asked.

QUERY CLARIFICATION:
- If the user query is ambiguous or underspecified, ask ONE short clarifying question before answering.

EDGE CASE HANDLING:
- If the document content is empty, respond: "The document does not contain any usable information."
- If the document appears inaccessible, respond: "Please provide a publicly accessible Google Doc link."

TONE & STYLE:
- Neutral, professional, and business-friendly.
- No emojis, no casual language.
- Short paragraphs, clear formatting.

OUTPUT FORMAT:
- Plain text response.
- Answer first, citations at the end of sentences.
- No markdown unless explicitly requested.`;

// Maximum document size: 5MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
// Fetch timeout: 10 seconds
const FETCH_TIMEOUT_MS = 10000;

/**
 * Validates that the URL is a legitimate Google Docs URL
 * Prevents SSRF attacks by strictly validating the hostname
 */
function isValidGoogleDocsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = ['docs.google.com', 'drive.google.com'];
    return allowedHosts.includes(parsed.hostname) && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchGoogleDocContent(url: string): Promise<string> {
  // Extract document ID from various Google Docs URL formats
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/
  ];

  let docId: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      docId = match[1];
      break;
    }
  }

  if (!docId) {
    throw new Error("Invalid Google Doc URL format");
  }

  // Fetch as plain text export with timeout and redirect prevention
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(exportUrl, {
      redirect: 'follow', // Allow redirects since URL is pre-validated
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found. Please check the URL.");
      }
      if (response.status === 403) {
        throw new Error("Document is private. Please make it publicly accessible.");
      }
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    // Check content length header first if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_DOCUMENT_SIZE) {
      throw new Error("Document is too large to process.");
    }

    const content = await response.text();
    
    // Validate content size after fetch
    if (content.length > MAX_DOCUMENT_SIZE) {
      throw new Error("Document is too large to process.");
    }
    
    if (!content || content.trim().length === 0) {
      throw new Error("The document does not contain any usable information.");
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Document fetch timed out. Please try again.");
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, documentUrl, conversationHistory } = await req.json() as RequestBody;

    if (!question || !documentUrl) {
      return new Response(
        JSON.stringify({ error: "Question and document URL are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side URL validation to prevent SSRF
    if (!isValidGoogleDocsUrl(documentUrl)) {
      console.warn("Invalid document URL attempted:", documentUrl);
      return new Response(
        JSON.stringify({ error: "Invalid document URL. Please provide a valid Google Docs URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Configuration error: LOVABLE_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch document content
    let documentContent: string;
    try {
      documentContent = await fetchGoogleDocContent(documentUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to access document";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array with conversation history (last 5 turns)
    const recentHistory = conversationHistory.slice(-10); // 5 user-assistant pairs = 10 messages
    
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `DOCUMENT CONTENT:\n\n${documentContent}\n\n---\n\nPlease answer questions based ONLY on the above document content.` 
      },
      ...recentHistory,
      { role: "user", content: question }
    ];

    console.log("Sending request to AI gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Upstream service error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Document chat error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
