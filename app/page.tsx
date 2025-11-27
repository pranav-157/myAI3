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
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";
import Link from "next/link";

/* ------------------------------------------------------------
   SCHEMA
------------------------------------------------------------ */

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

/* ------------------------------------------------------------
   SUGGESTED PROMPTS (for empty-state cards)
------------------------------------------------------------ */

const SUGGESTIONS: string[] = [
  "Plan a 3-day quiet-luxury stay in Jaipur with one palace hotel and one boutique property.",
  "Curate 3 hotel + outfit pairings for a business trip to Mumbai with evening cocktails.",
  "Design a weekend escape within 2 hours of Delhi with a private pool and late checkout.",
  "Suggest 4 dinner spots in Jaipur that feel intimate, not touristy, with great wine lists.",
];

/* ------------------------------------------------------------
   LOCAL STORAGE HELPERS
------------------------------------------------------------ */

const loadMessagesFromStorage = (): {
  messages: UIMessage[];
  durations: Record<string, number>;
} => {
  if (typeof window === "undefined") return { messages: [], durations: {} };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;

  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

/* ------------------------------------------------------------
   MAIN CHAT UI COMPONENT
------------------------------------------------------------ */

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };

  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [messages, durations, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prev) => ({ ...prev, [key]: duration }));
  };

  const hasUserMessage = messages.some((m) => m.role === "user");

  /* ----------------------------------------------
     Inject Welcome Message
  ---------------------------------------------- */

  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMsg: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      };

      setMessages([welcomeMsg]);
      saveMessagesToStorage([welcomeMsg], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  /* ----------------------------------------------
     Form handlers
  ---------------------------------------------- */

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
     UI Layout
  ------------------------------------------------------------ */

  return (
    <div className="flex h-screen justify-center items-center font-sans bg-[#050509] text-zinc-100">
      <main className="w-full h-screen relative">

        {/* ------------------ HEADER ------------------ */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mt-3 rounded-b-2xl border border-zinc-800/70 bg-black/80 backdrop-blur-xl shadow-[0_12px_26px_rgba(0,0,0,0.65)]">
              <ChatHeader>
                <ChatHeaderBlock />

                <ChatHeaderBlock className="flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2">
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

                    <p className="tracking-tight text-sm font-medium text-zinc-100">
                      {AI_NAME}
                    </p>
                  </div>

                  <p className="uppercase text-[10px] md:text-[11px] tracking-[0.16em] md:tracking-[0.22em] text-zinc-200 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)] whitespace-nowrap md:whitespace-normal text-center">
                    Quiet Luxury · Travel & Lifestyle Concierge
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

        {/* ------------------ MESSAGE AREA ------------------ */}
        <div className="h-screen overflow-y-auto w-full px-5 pt-[96px] pb-[180px] py-4">
          <div className="flex justify-center min-h-full">
            <div className="flex flex-col w-full max-w-3xl rounded-3xl bg-black/65 border border-zinc-800/70 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.55)] px-5 py-6">

              {/* Suggested cards only before the first user message */}
              {!hasUserMessage && (
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        form.setValue("message", s);
                        form.handleSubmit(onSubmit)();
                      }}
                      className="text-left rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 hover:border-[#C9B68A]/70 hover:bg-zinc-900 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {isClient ? (
                <>
                  <MessageWall
                    messages={messages}
                    status={status}
                    durations={durations}
                    onDurationChange={handleDurationChange}
                  />

                  {status === "submitted" && (
                    <div className="flex justify-start w-full mt-2">
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

        {/* ------------------ INPUT BAR (unchanged) ------------------ */}
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
                            className="h-13 pr-14 pl-5 bg-zinc-900/95 border border-zinc-700/80 rounded-full text-sm placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#C9B68A]/80 focus-visible:border-[#C9B68A]/80"
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
                              className="absolute right-2 top-2 size-9 rounded-full bg-[#C9B68A] text-black shadow-[0_0_18px_rgba(0,0,0,0.45)] hover:bg-[#d7c491]"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}

                          {(status === "submitted" || status === "streaming") && (
                            <Button
                              className="absolute right-2 top-2 size-9 rounded-full border border-zinc-600 bg-black/70 hover:bg-zinc-900"
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

          {/* ------------------ FOOTER ------------------ */}
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
