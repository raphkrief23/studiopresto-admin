"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage as ChatMessageType, FileChange } from "@/types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { ImageIcon } from "lucide-react";

interface ChatPanelProps {
  slug: string;
  onFilesApplied?: () => void;
}

function resizeAndConvert(file: File, maxSize = 1024): Promise<{ base64: string; mediaType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Resize if needed
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = resizedDataUrl.split(",")[1];
        resolve({
          base64,
          mediaType: "image/jpeg",
          previewUrl: resizedDataUrl,
        });
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatPanel({ slug, onFilesApplied }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(
    null
  );
  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setPendingImages((prev) => [...prev, ...imageFiles]);
    for (const file of imageFiles) {
      const { previewUrl } = await resizeAndConvert(file);
      setPendingPreviews((prev) => [...prev, previewUrl]);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = async (text: string, inputImages: File[]) => {
    // Merge images from drag & drop (pendingImages) and from input button
    const allImages = [...pendingImages, ...inputImages];

    // Resize and convert images to base64
    const imageData: { base64: string; mediaType: string; previewUrl: string }[] = [];
    for (const img of allImages) {
      const result = await resizeAndConvert(img);
      imageData.push(result);
    }

    // Upload images to the site's GitHub repo first
    const uploadedPaths: string[] = [];
    if (imageData.length > 0) {
      try {
        const uploadRes = await fetch(`/api/sites/${slug}/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: imageData.map((d) => ({
              base64: d.base64,
              mediaType: d.mediaType,
            })),
          }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.paths) {
          uploadedPaths.push(...uploadData.paths);
        }
      } catch (e) {
        console.error("Image upload to repo failed:", e);
      }
    }

    // Append uploaded image paths info to the user message for Claude
    let enrichedText = text;
    if (uploadedPaths.length > 0) {
      enrichedText += `\n\n[Images uploadees dans le repo: ${uploadedPaths.join(", ")}]`;
    }

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: "user",
      content: text,
      images: imageData.length > 0 ? imageData.map((d) => d.previewUrl) : undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPendingImages([]);
    setPendingPreviews([]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.role === "user" && m.id === userMessage.id ? enrichedText : m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          messages: apiMessages,
          images: imageData.map((d) => ({
            base64: d.base64,
            mediaType: d.mediaType,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = uuidv4();

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

      // Auto-apply: commit file changes automatically
      const { parseFileChanges } = await import("@/lib/file-parser");
      const fileChanges = parseFileChanges(assistantContent);
      if (fileChanges.length > 0) {
        setApplyingMessageId(assistantId);
        try {
          const commitRes = await fetch(`/api/sites/${slug}/commit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              files: fileChanges,
              message: "Update via StudioPresto Admin",
            }),
          });
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            setAppliedMessageIds((prev) => new Set(prev).add(assistantId));
            if (commitData.deployed) {
              onFilesApplied?.();
            }
          }
        } catch (e) {
          console.error("Auto-apply failed:", e);
        } finally {
          setApplyingMessageId(null);
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

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          addImages(Array.from(e.dataTransfer.files));
        }
      }}
    >
      {/* Drag overlay on entire chat panel */}
      {isDragOver && (
        <div className="absolute inset-0 bg-violet/10 border-2 border-dashed border-violet rounded-lg flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-violet font-medium text-lg">
            <ImageIcon className="w-6 h-6" />
            Deposez votre image ici
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && !isLoading && pendingPreviews.length === 0 && (
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
            isApplying={applyingMessageId === msg.id}
            isApplied={appliedMessageIds.has(msg.id)}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <TypingIndicator />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending images from drag & drop */}
      {pendingPreviews.length > 0 && (
        <div className="flex gap-2 px-3 py-2 border-t border-border overflow-x-auto">
          {pendingPreviews.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={src}
                alt=""
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
