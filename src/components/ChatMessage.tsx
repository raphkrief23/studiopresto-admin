"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { parseFileChanges, extractExplanation } from "@/lib/file-parser";
import { FileCode, Check, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  isApplying?: boolean;
  isApplied?: boolean;
}

export default function ChatMessage({
  message,
  isApplying,
  isApplied,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const fileChanges = !isUser ? parseFileChanges(message.content) : [];
  const explanation = !isUser
    ? extractExplanation(message.content)
    : message.content;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} px-4 mb-4`}
    >
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-bubble-user text-white rounded-2xl rounded-br-sm"
            : "bg-bubble-claude text-text rounded-2xl rounded-bl-sm"
        } px-4 py-3`}
      >
        {/* Images */}
        {message.images?.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="Image jointe"
            className="max-w-full rounded-lg mb-2"
          />
        ))}

        {/* Text content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {explanation}
        </div>

        {/* File changes status */}
        {fileChanges.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            {isApplying ? (
              <div className="flex items-center gap-1.5 text-violet text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploiement en cours...
              </div>
            ) : isApplied ? (
              <div className="flex items-center gap-1.5 text-green text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                {fileChanges.length} fichier{fileChanges.length > 1 ? "s" : ""} deploye{fileChanges.length > 1 ? "s" : ""}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted text-xs">
                <FileCode className="w-3.5 h-3.5" />
                {fileChanges.length} fichier{fileChanges.length > 1 ? "s" : ""} modifie{fileChanges.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
