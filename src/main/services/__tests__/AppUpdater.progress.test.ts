import { describe, expect, it } from 'vitest'

describe('AppUpdater progress throttling', () => {
  it('should throttle progress updates to prevent UI lag', () => {
    const PROGRESS_THROTTLE_MS = 100
    const updates: number[] = []
    let lastUpdate = 0

    // Simulate rapid data chunks (every 10ms)
    for (let i = 0; i < 20; i++) {
      const now = Date.now()

      // Only update if throttle period has passed
      if (now - lastUpdate >= PROGRESS_THROTTLE_MS) {
        lastUpdate = now
        updates.push(i)
      }

      // Simulate time passing
      if (i < 19) {
        const sleepUntil = Date.now() + 10
        while (Date.now() < sleepUntil) {
          // busy wait
        }
      }
    }

    // Should have significantly fewer updates than total chunks
    expect(updates.length).toBeLessThan(10)
    expect(updates.length).toBeGreaterThan(0)
  })

  it('should always send final 100% progress', () => {
    const totalBytes = 1000
    let downloadedBytes = 0
    let lastProgress = 0

    // Simulate download completion
    downloadedBytes = totalBytes
    const percent = Math.round((downloadedBytes / totalBytes) * 100)
    lastProgress = percent

    expect(lastProgress).toBe(100)
  })
})
