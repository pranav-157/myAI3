"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

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
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  // Inject welcome message on first load
  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };

      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations: Record<string, number> = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen items-center justify-center font-sans bg-gradient-to-br from-[#050509] via-[#050509] to-[#0b0b0f] text-zinc-100">
      <main className="w-full h-screen relative">
        {/* HEADER – subtle glass bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <div className="rounded-2xl border border-zinc-800/70 bg-black/70 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.6)]">
              <ChatHeader>
                <ChatHeaderBlock />

                <ChatHeaderBlock className="flex-col justify-center items-center gap-1 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 ring-1 ring-[#C9B68A]/60">
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
                  <p className="uppercase text-[10px] tracking-[0.20em] text-zinc-500">
                    Quiet luxury travel & lifestyle concierge
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

        {/* MAIN CHAT AREA – centered quiet-luxury card */}
        <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[116px] pb-[190px]">
          <div className="flex justify-center min-h-full">
            <div className="flex flex-col items-stretch justify-end w-full max-w-3xl rounded-3xl border border-zinc-800/80 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.7)] px-5 py-6">
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
                <div className="flex justify-center w-full">
                  <Loader2 className="size-4 animate-spin text-zinc-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INPUT BAR – subtle pill with muted champagne accent */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="w-full px-5 pt-4 pb-3 flex justify-center">
            <div className="relative w-full max-w-3xl">
              {/* soft radial highlight */}
              <div className="pointer-events-none absolute inset-x-8 -top-10 h-20 bg-[radial-gradient(circle_at_top,rgba(201,182,138,0.16),transparent)]" />

              <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="chat-form-message"
                          className="sr-only"
                        >
                          Message
                        </FieldLabel>
                        <div className="relative h-13">
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-13 pr-14 pl-5 bg-black/70 border border-zinc-700/80 rounded-full text-sm placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#C9B68A] focus-visible:border-[#C9B68A]"
                            placeholder="Ask Aurelian to design your next experience..."
                            disabled={status === "streaming"}
                            aria-invalid={fieldState.invalid}
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
                              className="absolute right-2 top-2 rounded-full size-9 bg-[#C9B68A] text-black shadow-[0_0_18px_rgba(0,0,0,0.45)] hover:bg-[#d7c491] disabled:opacity-40"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}

                          {(status === "streaming" ||
                            status === "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full size-9 border border-zinc-600 bg-black/70 hover:bg-zinc-900"
                              size="icon"
                              type="button"
                              onClick={() => {
                                stop();
                              }}
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
          <div className="w-full px-5 pb-3 flex justify-center text-[11px] text-zinc-500">
            <span>
              © {new Date().getFullYear()} {OWNER_NAME} ·{" "}
            </span>
            <Link
              href="/terms"
              className="underline underline-offset-2 mx-1"
            >
              Terms of Use
            </Link>
            <span className="mx-1">·</span>
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
