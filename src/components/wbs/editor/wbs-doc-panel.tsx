'use client'

import { useCallback, useMemo, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWbsDocStore } from '@/store/use-wbs-doc-store'
import { useWbsStore } from '@/store/use-wbs-store'
import { useWbsTaskList, useUpdateWbsTask } from '@/lib/queries/wbs'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import WbsDocEditor from './wbs-doc-editor'
import { Check, Loader2 } from 'lucide-react'

type SaveState = 'idle' | 'saving' | 'saved'

export default function WbsDocPanel() {
  const { isOpen, taskId, close } = useWbsDocStore()
  const activeProjectId = useWbsStore((s) => s.activeProjectId)
  const { data: rows } = useWbsTaskList(activeProjectId)
  const updateTask = useUpdateWbsTask()
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const task = useMemo(
    () => rows?.find((r) => r.id === taskId) ?? null,
    [rows, taskId]
  )

  const persist = useCallback(
    (id: string, json: JSONContent) => {
      updateTask.mutate(
        { id, document_content: json },
        { onSuccess: () => setSaveState('saved') }
      )
    },
    [updateTask]
  )

  const debouncedSave = useDebouncedCallback(persist, 800)

  const handleChange = useCallback(
    (json: JSONContent) => {
      if (!taskId) return
      setSaveState('saving')
      debouncedSave.run(taskId, json)
    },
    [taskId, debouncedSave]
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      debouncedSave.flush()
      close()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-zinc-100 px-6 py-4 text-left">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="truncate text-base">
              {task?.title || 'Untitled task'}
            </SheetTitle>
            <SaveIndicator state={saveState} />
          </div>
          <SheetDescription className="text-xs">
            {task?.wbs_code ? `WBS ${task.wbs_code}` : 'Task document'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5">
            {task ? (
              <WbsDocEditor
                key={task.id}
                content={task.document_content}
                onChange={handleChange}
              />
            ) : (
              <p className="text-sm text-zinc-400">Task not found.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" /> Saved
      </span>
    )
  }
  return null
}
