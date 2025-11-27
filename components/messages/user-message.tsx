import { UIMessage } from "ai";
import { Response } from "@/components/ai-elements/response";

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="whitespace-pre-wrap w-full flex justify-end">
      <div
        className="
          max-w-lg w-fit px-4 py-3 rounded-[20px]
          bg-zinc-900/90
          border border-zinc-700/80
          shadow-[0_0_18px_rgba(0,0,0,0.45)]
        "
      >
        <div className="text-sm text-zinc-50">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <Response key={`${message.id}-${i}`}>
                    {part.text}
                  </Response>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
}
