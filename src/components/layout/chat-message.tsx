"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/store/use-chat-store";

export default function ChatMessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white mt-0.5">
          R
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-indigo-500 text-white"
            : "bg-zinc-100 text-zinc-800"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
