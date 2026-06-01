import { useCallback, useEffect, useMemo, useRef } from 'react'

export type DebouncedCallback<A extends unknown[]> = {
  run: (...args: A) => void
  flush: () => void
  cancel: () => void
}

/**
 * Returns a debounced callback wrapper. The latest call within `delay` ms wins.
 * `flush()` runs the pending call immediately (used on unmount/close) and
 * `cancel()` drops it. Pending calls are flushed automatically on unmount so
 * in-flight edits are never lost.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number
): DebouncedCallback<A> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgs = useRef<A | null>(null)
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    pendingArgs.current = null
  }, [])

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (pendingArgs.current) {
      fnRef.current(...pendingArgs.current)
      pendingArgs.current = null
    }
  }, [])

  const run = useCallback(
    (...args: A) => {
      pendingArgs.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        if (pendingArgs.current) {
          fnRef.current(...pendingArgs.current)
          pendingArgs.current = null
        }
      }, delay)
    },
    [delay]
  )

  useEffect(() => {
    return () => {
      // Flush any pending call when the component unmounts.
      if (timer.current) {
        clearTimeout(timer.current)
        if (pendingArgs.current) fnRef.current(...pendingArgs.current)
      }
    }
  }, [])

  return useMemo(() => ({ run, flush, cancel }), [run, flush, cancel])
}
