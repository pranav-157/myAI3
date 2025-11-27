import { cn } from "@/lib/utils";
import React from "react";

export function ChatHeaderBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("gap-2 flex flex-1", className)}>
      {children}
    </div>
  );
}

export function ChatHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        `
        w-full flex items-center justify-between
        py-5 px-6

        /* Luxury Matte Gradient */
        bg-gradient-to-b
        from-[#1E1D1C]/95 
        to-[#131211]/95

        /* Subtle border + glass feel */
        border-b border-zinc-800/60
        backdrop-blur-2xl

        /* Premium shadow */
        shadow-[0_15px_40px_rgba(0,0,0,0.55)]
      `
      )}
    >
      {children}
    </div>
  );
}
