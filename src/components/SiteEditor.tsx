"use client";

import { useState, useCallback } from "react";
import ChatPanel from "./ChatPanel";
import PreviewPanel from "./PreviewPanel";

interface SiteEditorProps {
  slug: string;
  siteName: string;
  siteUrl: string;
}

export default function SiteEditor({
  slug,
  siteName,
  siteUrl,
}: SiteEditorProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");

  const handleFilesApplied = useCallback(() => {
    // Deploy is already done server-side, just refresh the iframe
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      {/* Desktop: split panels */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[45%] shrink-0 overflow-hidden">
          <ChatPanel slug={slug} onFilesApplied={handleFilesApplied} />
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1 overflow-hidden">
          <PreviewPanel url={siteUrl} refreshKey={refreshKey} />
        </div>
      </div>

      {/* Mobile: tabs */}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === "chat"
                ? "text-violet border-b-2 border-violet"
                : "text-muted"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === "preview"
                ? "text-violet border-b-2 border-violet"
                : "text-muted"
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" ? (
            <ChatPanel slug={slug} onFilesApplied={handleFilesApplied} />
          ) : (
            <PreviewPanel url={siteUrl} refreshKey={refreshKey} />
          )}
        </div>
      </div>
    </>
  );
}
