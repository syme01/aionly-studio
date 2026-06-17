import { loggerService } from '@logger'
import { pageListApi } from '@renderer/api/openManagement'
import type { Model } from '@renderer/types'
import { useCallback, useEffect, useRef, useState } from 'react'

const logger = loggerService.withContext('useAiOnlyModels')

export enum ModelAttribute {
  TextModel = 'text_model',
  ImageModel = 'image_generation'
}

export interface ModelPageParams {
  type: string
  modelAttribute: ModelAttribute
  pageNum: number
  pageSize: number
  total: number
  orderByStatus: number // 1=先有效再停用再失效/下架
  orderByTime: string // 有效组内按时间倒序
  domain: string
}

export interface AiOnlyModel {
  modelName: string
  serviceName: string
  modelFileUrl?: string
  provider: string
  group: string
  [key: string]: any
}

export interface UseAiOnlyModelsOptions {
  /** 初始页码，默认 1 */
  initialPageNum?: number
  /** 每页大小，默认 10 */
  pageSize?: number
  /** 模型属性类型，默认 TextModel */
  modelAttribute?: ModelAttribute
  /** 是否自动加载第一页，默认 true */
  autoFetch?: boolean
  /** 滚动加载触发距离（距离底部多少像素时触发），默认 50 */
  scrollThreshold?: number
}

export interface UseAiOnlyModelsResult {
  /** 模型列表 */
  models: AiOnlyModel[]
  /** 加载状态 */
  loading: boolean
  /** 分页参数 */
  pageParams: ModelPageParams
  /** 获取指定页的模型 */
  fetchModels: (pageNum: number) => Promise<void>
  /** 加载下一页 */
  fetchNextPage: () => Promise<void>
  /** 重置并重新加载 */
  reset: () => void
  /** 是否还有更多数据 */
  hasMore: boolean
  /** 滚动事件处理器，用于无限滚动加载 */
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

/**
 * AiOnly 模型列表分页 Hook
 *
 * @example
 * ```tsx
 * const { models, loading, handleScroll, hasMore } = useAiOnlyModels({
 *   pageSize: 20,
 *   autoFetch: true
 * })
 *
 * return (
 *   <div onScroll={handleScroll}>
 *     {models.map(model => <div key={model.modelName}>{model.name}</div>)}
 *     {loading && <div>Loading...</div>}
 *   </div>
 * )
 * ```
 */
export function useAiOnlyModels(options: UseAiOnlyModelsOptions = {}): UseAiOnlyModelsResult {
  const {
    initialPageNum = 1,
    pageSize = 10,
    modelAttribute = ModelAttribute.TextModel,
    autoFetch = true,
    scrollThreshold = 50
  } = options

  const [models, setModels] = useState<AiOnlyModel[]>([])
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const initializedRef = useRef(false) // 防止重复初始化

  const pageParamsRef = useRef<ModelPageParams>({
    type: '1',
    modelAttribute,
    pageNum: initialPageNum,
    pageSize,
    total: 0,
    orderByStatus: 1,
    orderByTime: 'desc',
    domain: window.location.hostname
  })

  const [pageParams, setPageParams] = useState<ModelPageParams>(pageParamsRef.current)

  const fetchModels = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return

    loadingRef.current = true
    setLoading(true)

    try {
      const params = { ...pageParamsRef.current, pageNum }
      logger.info('Fetching models with params', { params })
      const res: any = await pageListApi(params)
      logger.info('API response', { code: res?.code, rowsCount: res?.rows?.length })

      if (res?.code === 200) {
        const data = res.rows || []
        logger.info('Data rows count', { count: data.length })
        const modelList: AiOnlyModel[] = data.map((item: any) => ({
          ...item,
          name: item.modelName,
          provider: 'aionly',
          group: item.serviceName
        }))

        // 使用 queueMicrotask 避免在渲染周期内调用 setState
        queueMicrotask(() => {
          setModels((prevModels) => {
            // 如果是第一页，直接替换；否则追加
            const newModels = pageNum === 1 ? modelList : [...prevModels, ...modelList]
            logger.info('Updated models count', { count: newModels.length })
            return newModels
          })

          const newParams = {
            ...pageParamsRef.current,
            total: res.total || 0,
            pageNum
          }
          pageParamsRef.current = newParams
          setPageParams(newParams)
        })
      } else {
        logger.warn('API returned non-200 code', { code: res?.code })
      }
    } catch (e: any) {
      logger.error('Failed to fetch models', { error: e })
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  const fetchNextPage = useCallback(async () => {
    const nextPage = pageParamsRef.current.pageNum + 1
    await fetchModels(nextPage)
  }, [fetchModels])

  const reset = useCallback(() => {
    setModels([])
    pageParamsRef.current = {
      ...pageParamsRef.current,
      pageNum: initialPageNum,
      total: 0
    }
    setPageParams(pageParamsRef.current)
    void fetchModels(initialPageNum)
  }, [fetchModels, initialPageNum])

  const hasMore = models.length < pageParams.total

  // 滚动事件处理器，用于无限滚动加载
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      logger.info('handleScroll', { scrollEvent: e.type })
      if (loadingRef.current || !hasMore) return

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      // 距底部 scrollThreshold 像素以内触发加载
      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        void fetchNextPage()
      }
    },
    [hasMore, scrollThreshold, fetchNextPage]
  )

  // 自动加载第一页
  useEffect(() => {
    if (autoFetch && !initializedRef.current) {
      initializedRef.current = true
      logger.info('Auto-fetching first page')
      void fetchModels(initialPageNum)
    }
  }, [autoFetch, fetchModels, initialPageNum])

  return {
    models,
    loading,
    pageParams,
    fetchModels,
    fetchNextPage,
    hasMore,
    reset,
    handleScroll
  }
}

/**
 * 将 AiOnlyModel 转换为标准 Model 类型
 */
export function convertToStandardModel(aiOnlyModel: AiOnlyModel): Model {
  return {
    id: aiOnlyModel.modelName,
    name: aiOnlyModel.modelName,
    provider: aiOnlyModel.provider,
    group: aiOnlyModel.serviceName || aiOnlyModel.group
  }
}
