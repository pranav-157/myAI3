"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";
import Image from "next/image";
import Link from "next/link";

/* ------------------------------------------------------------
   Schema
------------------------------------------------------------ */

const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

const STORAGE_KEY = "chat-messages";

type DurationsMap = Record<string, number>;

type StoragePayload = {
  messages: UIMessage[];
  durations: DurationsMap;
};

/* ------------------------------------------------------------
   Suggested prompts
------------------------------------------------------------ */

const SUGGESTIONS: string[] = [
  "Curate a quiet-luxury 2–3 day Jaipur itinerary with palace-like hotel options",
  "Recommend exquisite dining experiences in Jaipur that one should visit",
  "Help me choose the right car for a smooth, comfortable trip to Jaipur’s forts",
  "Suggest some designer boutiques or gift shops to visit before leaving Jaipur",
];

/* ------------------------------------------------------------
   Storage helpers
------------------------------------------------------------ */

const loadMessagesFromStorage = (): StoragePayload => {
  if (typeof window === "undefined") {
    return { messages: [], durations: {} };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { messages: [], durations: {} };
    }

    const parsed = JSON.parse(stored) as Partial<StoragePayload>;
    return {
      messages: parsed.messages ?? [],
      durations: parsed.durations ?? {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: DurationsMap
): void => {
  if (typeof window === "undefined") return;

  try {
    const payload: StoragePayload = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

/* ------------------------------------------------------------
   Main Component
------------------------------------------------------------ */

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<DurationsMap>({});
  const welcomeShown = useRef<boolean>(false);

  const stored = loadMessagesFromStorage();
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  const hasUserMessage = messages.some((m) => m.role === "user");

  /* Initialize client + restore */
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Persist */
  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages as UIMessage[], durations);
    }
  }, [messages, durations, isClient]);

  /* Track durations */
  const handleDurationChange = (key: string, value: number) => {
    setDurations((prev) => ({ ...prev, [key]: value }));
  };

  /* Welcome message */
  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeShown.current
    ) {
      const msg: UIMessage = {
        id: "welcome-" + Date.now().toString(),
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };

      setMessages([msg]);
      saveMessagesToStorage([msg], {});
      welcomeShown.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  /* Form */
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    sendMessage({ text: data.message });
    form.reset();
  };

  const clearChat = () => {
    setMessages([]);
    setDurations({});
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  };

  /* ------------------------------------------------------------
     UI
  ------------------------------------------------------------ */

  return (
    <div className="flex h-screen justify-center items-center font-sans bg-[#050509] text-zinc-100">
      <main className="w-full h-screen relative">
        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-4xl px-4">
            <div
              className="
                mt-3 rounded-b-2xl
                bg-gradient-to-b from-[#1E1D1C]/95 to-[#131211]/95
                border border-zinc-800/70
                backdrop-blur-2xl
                shadow-[0_10px_40px_rgba(0,0,0,0.55)]
              "
            >
              <ChatHeader>
                <ChatHeaderBlock />

                <ChatHeaderBlock className="flex-col items-center justify-center gap-1">
  <div className="flex items-center gap-3">
    <Avatar className="size-8 ring-1 ring-[#C9B68A]/70">
      <AvatarImage src="/logo.png" />
      <AvatarFallback>
        <Image
          src="/logo.png"
          alt="Logo"
          width={32}
          height={32}
        />
      </AvatarFallback>
    </Avatar>

    {/* Aurelian name */}
    <h1 className="text-xl sm:text-2xl font-semibold tracking-[0.04em] text-zinc-100">
      {AI_NAME}
    </h1>
  </div>

  {/* Tagline */}
  <p
    className="
      uppercase
      text-xs sm:text-sm
      tracking-[0.28em]
      text-zinc-200 
      drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]
      whitespace-pre text-center
      mt-1
    "
  >
    QUIET LUXURY · TRAVEL & LIFESTYLE CONCIERGE
  </p>

  {/* NEW SMALL SUBTEXT LINE */}
  <p
    className="
      text-[11px]
      text-zinc-400/70
      italic
      tracking-wide
      mt-1
      text-center
    "
  >
    (currently specialised in Jaipur’s finest)
  </p>
</ChatHeaderBlock>


                <ChatHeaderBlock className="justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer border-zinc-700 bg-black/40 hover:bg-zinc-900/70 text-xs text-zinc-200"
                    onClick={clearChat}
                  >
                    <Plus className="size-3 mr-1" />
                    {CLEAR_CHAT_TEXT}
                  </Button>
                </ChatHeaderBlock>
              </ChatHeader>
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="h-screen overflow-y-auto w-full px-5 pt-[140px] pb-[180px] py-4">
          <div className="flex justify-center min-h-full">
            <div
              className="
                flex flex-col w-full max-w-3xl
                rounded-3xl
                bg-[#050506]/95
                border border-zinc-800/70
                backdrop-blur-xl
                shadow-[0_0_30px_rgba(0,0,0,0.55)]
                px-5 py-6
              "
            >
              {/* Suggested prompts (empty state) */}
{!hasUserMessage && (
  <div className="mb-5">
    {/* WELCOME NOTE — WITHOUT THE SUBTEXT */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">
          Welcome to Aurelian
        </h2>
        <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
         I'm Aurelian — here to curate your Jaipur stay end-to-end: where you stay, how you travel, what you wear, what you taste, and what you take home. Tell me your preferences, and I'll tailor everything with precision.
        </p>
      </div>
    
    {/* Subtle Title */}
    <p className="text-[10px] tracking-wider uppercase text-zinc-500 mb-2 pl-1 opacity-80">
      suggested prompts
    </p>

    {/* Grid of suggestions */}
    <div className="grid gap-3 sm:grid-cols-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => {
            form.setValue("message", s);
            form.handleSubmit(onSubmit)();
          }}
          className="
            text-left rounded-2xl 
            border border-zinc-700/80 
            bg-zinc-900/80 px-4 py-3 
            text-sm text-zinc-200 
            hover:border-[#C9B68A]/70 
            hover:bg-zinc-900 
            transition-colors
          "
        >
          {s}
        </button>
      ))}
    </div>

  </div>
)}


              {/* Messages */}
              {isClient ? (
                <>
                  <MessageWall
                    messages={messages}
                    status={status}
                    durations={durations}
                    onDurationChange={handleDurationChange}
                  />

                  {status === "submitted" && (
                    <div className="flex justify-start mt-2">
                      <Loader2 className="size-4 animate-spin text-zinc-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center">
                  <Loader2 className="size-4 animate-spin text-zinc-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INPUT BAR — unchanged */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-3">
          <div className="w-full px-5 flex justify-center">
            <div className="relative w-full max-w-3xl">
              <div className="pointer-events-none absolute inset-x-8 -top-12 h-20 bg-[radial-gradient(circle_at_top,rgba(201,182,138,0.14),transparent)]" />

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="sr-only">
                          Message
                        </FieldLabel>

                        <div className="relative h-13">
                          <Input
                            {...field}
                            className="
                              h-13 pr-14 pl-5 bg-zinc-900/95 
                              border border-zinc-700/80 
                              rounded-full text-sm 
                              placeholder:text-zinc-500
                              focus-visible:ring-1 
                              focus-visible:ring-[#C9B68A]/80 
                              focus-visible:border-[#C9B68A]/80
                            "
                            placeholder="Ask Aurelian to design your next experience..."
                            disabled={status === "streaming"}
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />

                          {(status === "ready" || status === "error") && (
                            <Button
                              className="
                                absolute right-2 top-2 size-9 rounded-full 
                                bg-[#C9B68A] text-black 
                                shadow-[0_0_18px_rgba(0,0,0,0.45)]
                                hover:bg-[#d7c491]
                              "
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}

                          {(status === "submitted" || status === "streaming") && (
                            <Button
                              className="
                                absolute right-2 top-2 size-9 rounded-full 
                                border border-zinc-600 
                                bg-black/70 hover:bg-zinc-900
                              "
                              type="button"
                              size="icon"
                              onClick={() => stop()}
                            >
                              <Square className="size-4 text-zinc-200" />
                            </Button>
                          )}
                        </div>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </div>

          {/* FOOTER */}
          <div className="w-full px-5 mt-2 text-[11px] text-zinc-500 flex justify-center gap-1">
            <span>© {new Date().getFullYear()} {OWNER_NAME}</span>
            <span>·</span>
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Use
            </Link>
            <span>·</span>
            <span>
              Powered by{" "}
              <Link
                href="https://ringel.ai/"
                className="underline underline-offset-2"
              >
                Ringel.AI
              </Link>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
