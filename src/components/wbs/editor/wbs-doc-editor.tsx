'use client'

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { SlashCommand } from './slash-command'

type WbsDocEditorProps = {
  content: JSONContent | null
  onChange: (json: JSONContent) => void
}

export default function WbsDocEditor({ content, onChange }: WbsDocEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // required under Next.js App Router SSR
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Type '/' for commands…",
      }),
      SlashCommand,
    ],
    content: content ?? '',
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm max-w-none focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  return <EditorContent editor={editor} />
}
