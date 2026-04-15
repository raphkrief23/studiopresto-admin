"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { parseFileChanges, extractExplanation } from "@/lib/file-parser";
import { FileCode, Check } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  onApply?: (files: { path: string; content: string }[]) => void;
  isApplying?: boolean;
  isApplied?: boolean;
}

export default function ChatMessage({
  message,
  onApply,
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

        {/* File changes badge + apply button */}
        {fileChanges.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <FileCode className="w-3.5 h-3.5" />
              <span>
                {fileChanges.length} fichier{fileChanges.length > 1 ? "s" : ""}{" "}
                modifie{fileChanges.length > 1 ? "s" : ""}
              </span>
            </div>
            {/* List modified files */}
            <div className="space-y-1 mb-3">
              {fileChanges.map((fc, i) => (
                <div key={i} className="text-xs text-muted font-mono bg-bg/30 px-2 py-1 rounded">
                  {fc.path}
                </div>
              ))}
            </div>
            {isApplied ? (
              <div className="flex items-center gap-1.5 text-green text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                Modifications appliquees
              </div>
            ) : (
              <button
                onClick={() => onApply?.(fileChanges)}
                disabled={isApplying}
                className="px-3 py-1.5 bg-violet hover:bg-violet-hover disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors duration-200"
              >
                {isApplying
                  ? "Application en cours..."
                  : `Appliquer (${fileChanges.length} fichier${fileChanges.length > 1 ? "s" : ""})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
