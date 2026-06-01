import { create } from 'zustand'

type WbsDocState = {
  isOpen: boolean
  taskId: string | null
  open: (taskId: string) => void
  close: () => void
}

export const useWbsDocStore = create<WbsDocState>((set) => ({
  isOpen: false,
  taskId: null,
  open: (taskId) => set({ isOpen: true, taskId }),
  close: () => set({ isOpen: false, taskId: null }),
}))
