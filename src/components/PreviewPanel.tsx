"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

interface PreviewPanelProps {
  url: string;
  refreshKey?: number;
}

export default function PreviewPanel({ url, refreshKey }: PreviewPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);

  // Auto-refresh when refreshKey changes (after deploy)
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      setIframeKey((k) => k + 1);
    }
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Browser bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1A1A1E] border-b border-border">
        {/* macOS dots */}
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>

        {/* URL bar */}
        <div className="flex-1 bg-[#111] rounded-md px-3 py-1.5 text-muted text-xs truncate">
          {url}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={refresh}
            className="p-1.5 text-muted hover:text-text transition-colors duration-200"
            title="Rafraichir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(url, "_blank")}
            className="p-1.5 text-muted hover:text-text transition-colors duration-200"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        <iframe
          key={iframeKey}
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title="Preview du site"
        />
      </div>
    </div>
  );
}
