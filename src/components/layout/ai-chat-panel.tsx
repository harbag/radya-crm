"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";
import { useDealsStore } from "@/store/use-deals-store";
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { useLeadsStore } from "@/store/use-leads-store";
import { useTasksStore } from "@/store/use-tasks-store";
import { generateResponse } from "@/lib/chat-responder";
import ChatMessageBubble from "./chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIChatPanel() {
  const { messages, isOpen, toggle, addMessage, clear } = useChatStore();
  const { deals } = useDealsStore();
  const { contacts } = useContactsStore();
  const { companies } = useCompaniesStore();
  const { leads } = useLeadsStore();
  const { tasks } = useTasksStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    addMessage("user", text);
    setInput("");

    // Generate response after a brief delay for UX
    setTimeout(() => {
      const response = generateResponse(text, {
        deals,
        contacts,
        companies,
        leads,
        tasks,
      });
      addMessage("assistant", response);
    }, 300);
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggle}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          isOpen
            ? "bg-zinc-800 text-white"
            : "bg-indigo-500 text-white hover:bg-indigo-600"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed z-40 flex flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300",
          "bottom-20 right-3 left-3 h-[70vh] sm:bottom-6 sm:left-auto sm:right-20 sm:h-[520px] sm:w-96",
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none h-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
              R
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                CRM Assistant
              </p>
              <p className="text-[10px] text-zinc-400">
                Powered by Radya CRM
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your CRM data..."
              className="h-9 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
