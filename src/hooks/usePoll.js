import { useEffect, useRef, useState } from 'react'

// Polls an async loader on an interval. Useful for keeping the live queue
// dashboard fresh without websockets. Returns { data, loading, error, refresh }.
export function usePoll(loader, { interval = 10000, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timer = useRef(null)
  const mounted = useRef(true)

  const load = async () => {
    try {
      const result = await loader()
      if (!mounted.current) return
      setData(result)
      setError(null)
    } catch (err) {
      if (mounted.current) setError(err)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    if (!enabled) { setLoading(false); return }
    load()
    if (interval > 0) {
      timer.current = setInterval(load, interval)
    }
    return () => {
      mounted.current = false
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, ...deps])

  return { data, loading, error, refresh: load }
}
