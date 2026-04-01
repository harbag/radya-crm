import { create } from "zustand";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (role: ChatMessage["role"], content: string) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your Radya CRM assistant. I can help you analyze your sales data and answer questions about your pipeline. Try asking:\n\n- \"What's the total pipeline?\"\n- \"Show me the win rate\"\n- \"Who are the top clients?\"\n- \"How many open tasks?\"",
      timestamp: new Date().toISOString(),
    },
  ],
  isOpen: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  addMessage: (role, content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${Date.now()}`,
          role,
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  clear: () =>
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Chat cleared. How can I help you?",
          timestamp: new Date().toISOString(),
        },
      ],
    }),
}));
