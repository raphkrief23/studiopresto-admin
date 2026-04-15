export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4">
      <div className="bg-bubble-claude rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
