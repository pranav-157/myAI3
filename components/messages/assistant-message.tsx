import { UIMessage, ToolCallPart, ToolResultPart } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";
import { ToolCall, ToolResult } from "./tool-call";

const CONTACT_EMAIL = "pranav.157@gmail.com";

export function AssistantMessage({
  message,
  status,
  isLastMessage,
  durations,
  onDurationChange,
}: {
  message: UIMessage;
  status?: string;
  isLastMessage?: boolean;
  durations?: Record<string, number>;
  onDurationChange?: (key: string, duration: number) => void;
}) {
  // Build and open mailto link with this message's text
  const handleEmailConfirm = () => {
    // Collect all text parts from the assistant message
    const plainText =
      message.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n\n") ?? "";

    const subject = "Confirmation: Aurelian recommendation";

    const body = `Hi,

I'd like to go ahead with the following recommendation from Aurelian:

${plainText}

Best,
`;

    const mailto = `mailto:${encodeURIComponent(
      CONTACT_EMAIL
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (typeof window !== "undefined") {
      window.location.href = mailto;
    }
  };

  return (
    <div className="w-full">
      <div className="text-sm flex flex-col gap-4">
        {message.parts.map((part, i) => {
          const isStreaming =
            status === "streaming" &&
            isLastMessage &&
            i === message.parts.length - 1;
          const durationKey = `${message.id}-${i}`;
          const duration = durations?.[durationKey];

          if (part.type === "text") {
            return (
              <Response key={`${message.id}-${i}`}>{part.text}</Response>
            );
          } else if (part.type === "reasoning") {
            return (
              <ReasoningPart
                key={`${message.id}-${i}`}
                part={part}
                isStreaming={isStreaming}
                duration={duration}
                onDurationChange={
                  onDurationChange
                    ? (d) => onDurationChange(durationKey, d)
                    : undefined
                }
              />
            );
          } else if (
            part.type.startsWith("tool-") ||
            part.type === "dynamic-tool"
          ) {
            if ("state" in part && part.state === "output-available") {
              return (
                <ToolResult
                  key={`${message.id}-${i}`}
                  part={part as unknown as ToolResultPart}
                />
              );
            } else {
              return (
                <ToolCall
                  key={`${message.id}-${i}`}
                  part={part as unknown as ToolCallPart}
                />
              );
            }
          }
          return null;
        })}

        {/* Subtle email confirmation button */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleEmailConfirm}
            className="
              text-[11px] px-3 py-1
              rounded-full
              border border-zinc-700/70
              text-zinc-300
              hover:border-[#C9B68A]/80
              hover:text-[#C9B68A]
              hover:bg-zinc-900
              transition-colors
            "
          >
            Email this plan to confirm
          </button>
        </div>
      </div>
    </div>
  );
}
