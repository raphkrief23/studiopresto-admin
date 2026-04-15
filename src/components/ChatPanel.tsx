"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage as ChatMessageType, FileChange } from "@/types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { Loader2 } from "lucide-react";

interface ChatPanelProps {
  slug: string;
  onFilesApplied?: () => void;
}

export default function ChatPanel({ slug, onFilesApplied }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (text: string, images: File[]) => {
    // Upload images first if any
    const imageUrls: string[] = [];
    for (const image of images) {
      const formData = new FormData();
      formData.append("file", image);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) imageUrls.push(data.url);
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: "user",
      content: text,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build messages for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          messages: apiMessages,
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = uuidv4();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        },
      ]);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  assistantContent += parsed.delta.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMsg: ChatMessageType = {
        id: uuidv4(),
        role: "assistant",
        content: `Erreur : ${error instanceof Error ? error.message : "Une erreur est survenue"}. Veuillez reessayer.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (messageId: string, files: FileChange[]) => {
    setApplyingMessageId(messageId);
    try {
      const response = await fetch(`/api/sites/${slug}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          message: `Update via StudioPresto Admin`,
        }),
      });

      if (!response.ok) {
        throw new Error("Commit failed");
      }

      const data = await response.json();
      setAppliedMessageIds((prev) => new Set(prev).add(messageId));

      // Signal parent to refresh preview — deploy is done server-side
      if (data.deployed) {
        onFilesApplied?.();
      }
    } catch (error) {
      console.error("Apply failed:", error);
    } finally {
      setApplyingMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted text-base">
              Decrivez les modifications souhaitees
            </p>
            <p className="text-muted2 text-sm mt-2">
              Vous pouvez aussi glisser-deposer des images
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onApply={(files) => handleApply(msg.id, files)}
            isApplying={applyingMessageId === msg.id}
            isApplied={appliedMessageIds.has(msg.id)}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <TypingIndicator />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
