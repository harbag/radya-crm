import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor, Range } from '@tiptap/core'

type SlashItem = {
  title: string
  hint: string
  command: (props: { editor: Editor; range: Range }) => void
}

const ITEMS: SlashItem[] = [
  {
    title: 'Heading 1',
    hint: '/h1',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 1 })
        .run(),
  },
  {
    title: 'Heading 2',
    hint: '/h2',
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 2 })
        .run(),
  },
  {
    title: 'Bullet List',
    hint: '/bullet',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Code Block',
    hint: '/code',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'To-do List',
    hint: '/todo',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
]

function filterItems(query: string): SlashItem[] {
  const q = query.toLowerCase()
  if (!q) return ITEMS
  return ITEMS.filter(
    (i) =>
      i.title.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q)
  )
}

/**
 * Lightweight vanilla-DOM popover for the slash menu — avoids a tippy/React
 * renderer dependency. Manages its own keyboard selection state.
 */
function createMenuRenderer() {
  let el: HTMLDivElement | null = null
  let items: SlashItem[] = []
  let selected = 0
  let onPick: ((item: SlashItem) => void) | null = null

  const render = () => {
    if (!el) return
    el.innerHTML = ''
    items.forEach((item, i) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = [
        'flex w-full items-center justify-between gap-4 rounded-md px-2 py-1.5 text-left text-sm',
        i === selected ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700',
      ].join(' ')
      const title = document.createElement('span')
      title.textContent = item.title
      const hint = document.createElement('span')
      hint.className = 'text-xs text-zinc-400'
      hint.textContent = item.hint
      btn.appendChild(title)
      btn.appendChild(hint)
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        onPick?.(item)
      })
      el!.appendChild(btn)
    })
  }

  const position = (rect: DOMRect | null) => {
    if (!el || !rect) return
    el.style.top = `${rect.bottom + window.scrollY + 4}px`
    el.style.left = `${rect.left + window.scrollX}px`
  }

  return {
    mount(rect: DOMRect | null, pickFn: (item: SlashItem) => void) {
      el = document.createElement('div')
      el.className =
        'absolute z-[60] min-w-[200px] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg'
      el.style.position = 'absolute'
      document.body.appendChild(el)
      onPick = pickFn
      position(rect)
      render()
    },
    update(newItems: SlashItem[], rect: DOMRect | null) {
      items = newItems
      if (selected >= items.length) selected = Math.max(0, items.length - 1)
      position(rect)
      render()
    },
    onKeyDown(event: KeyboardEvent): boolean {
      if (!el || items.length === 0) return false
      if (event.key === 'ArrowDown') {
        selected = (selected + 1) % items.length
        render()
        return true
      }
      if (event.key === 'ArrowUp') {
        selected = (selected - 1 + items.length) % items.length
        render()
        return true
      }
      if (event.key === 'Enter') {
        onPick?.(items[selected])
        return true
      }
      return false
    },
    destroy() {
      el?.remove()
      el = null
      items = []
      selected = 0
      onPick = null
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashItem
        }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filterItems(query),
        render: () => {
          const menu = createMenuRenderer()
          let currentCommand:
            | ((item: SlashItem) => void)
            | null = null

          return {
            onStart: (props: {
              items: SlashItem[]
              command: (item: SlashItem) => void
              clientRect?: (() => DOMRect | null) | null
            }) => {
              currentCommand = props.command
              menu.mount(props.clientRect?.() ?? null, (item) =>
                currentCommand?.(item)
              )
              menu.update(props.items, props.clientRect?.() ?? null)
            },
            onUpdate: (props: {
              items: SlashItem[]
              command: (item: SlashItem) => void
              clientRect?: (() => DOMRect | null) | null
            }) => {
              currentCommand = props.command
              menu.update(props.items, props.clientRect?.() ?? null)
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === 'Escape') {
                menu.destroy()
                return true
              }
              return menu.onKeyDown(props.event)
            },
            onExit: () => {
              menu.destroy()
            },
          }
        },
      }),
    ]
  },
})
