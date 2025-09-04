import { useCallback } from 'react'

/**
 * Lazily imports canvas-confetti the first time you fire it.
 * Fails silently if the lib isn't installed (so it won't break dev).
 */
export function useConfetti() {
  return useCallback(async (opts?: {
    origin?: { x: number; y: number }
    scalar?: number
    particleCount?: number
  }) => {
    try {
      const mod = await import('canvas-confetti')
      const confetti = mod.default
      confetti({
        particleCount: opts?.particleCount ?? 80,
        spread: 65,
        startVelocity: 35,
        gravity: 0.9,
        ticks: 200,
        scalar: opts?.scalar ?? 1,
        origin: opts?.origin ?? { x: 0.6, y: 0.2 },
      })
    } catch {
      // no-op if library isn't present
    }
  }, [])
}

export default useConfetti
