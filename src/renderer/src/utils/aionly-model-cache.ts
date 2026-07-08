import type { ApiModel } from '@renderer/types'

const CACHE_KEY = 'aionly_model_cache'
const MAX_CACHE_SIZE = 2000 // 只缓存最近 2000 个模型

interface CachedModel {
  model: ApiModel
  timestamp: number
}

/**
 * 缓存 AiOnly 模型信息到 localStorage
 * 只保留最近 20 个模型，避免存储溢出
 */
export function cacheAiOnlyModel(model: ApiModel): void {
  try {
    const cache = getCache()

    // 移除已存在的相同模型（如果有）
    const filtered = cache.filter((item) => item.model.id !== model.id)

    // 添加新模型到开头
    filtered.unshift({
      model,
      timestamp: Date.now()
    })

    // 只保留最近的 MAX_CACHE_SIZE 个
    const trimmed = filtered.slice(0, MAX_CACHE_SIZE)

    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
  } catch (error: any) {
    throw new Error(error)
    // console.warn('Failed to cache aionly model:', error)
  }
}

/**
 * 从缓存中获取 AiOnly 模型信息
 */
export function getCachedAiOnlyModel(modelId: string): ApiModel | undefined {
  try {
    const cache = getCache()
    const found = cache.find((item) => item.model.id === modelId)
    return found?.model
  } catch (error) {
    // console.warn('Failed to get cached aionly model:', error)
    return undefined
  }
}

/**
 * 获取所有缓存的模型
 */
function getCache(): CachedModel[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return []
    return JSON.parse(cached) as CachedModel[]
  } catch (error) {
    // console.warn('Failed to parse aionly model cache:', error)
    return []
  }
}

/**
 * 清除所有缓存
 */
export function clearAiOnlyModelCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    // console.warn('Failed to clear aionly model cache:', error)
  }
}

/**
 * 获取缓存统计信息
 */
export function getAiOnlyModelCacheStats(): { count: number; sizeKB: number } {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const sizeKB = cached ? new Blob([cached]).size / 1024 : 0
    const count = getCache().length
    return { count, sizeKB }
  } catch (error) {
    return { count: 0, sizeKB: 0 }
  }
}
