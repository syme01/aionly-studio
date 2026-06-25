// src/renderer/src/hooks/useNewApiModels.ts

import { agentModelFilter, isNotSupportTextDeltaModel } from '@renderer/config/models'
import type { ApiModel, Model, Provider } from '@renderer/types'
import { isNewApiProvider } from '@renderer/utils/provider'
import { uniqBy } from 'lodash'
import { useCallback, useState } from 'react'

// 完整复制 handleAddModel 的处理逻辑
function processModelLikeAddModel(model: Model, provider: Provider): Model {
  // 1. 设置 supported_text_delta
  let processedModel = {
    ...model,
    supported_text_delta: !isNotSupportTextDeltaModel(model)
  }

  // 2. 如果是 newApi provider，设置 endpoint_type
  if (isNewApiProvider(provider)) {
    const endpointTypes = model.supported_endpoint_types
    if (endpointTypes && endpointTypes.length > 0) {
      processedModel = {
        ...processedModel,
        endpoint_type: endpointTypes.includes('image-generation') ? 'image-generation' : endpointTypes[0]
      }
    }
  }

  return processedModel
}

// 把你的接口数据转成 Model 格式
function transformToModel(item: any, provider: Provider): Model {
  return {
    id: item.id,
    provider: provider.id,
    name: item.name || item.id,
    group: item.group || provider.id,
    owned_by: item.owned_by,
    description: item.description,
    capabilities: item.capabilities,
    type: item.type,
    pricing: item.pricing,
    endpoint_type: item.endpoint_type,
    supported_endpoint_types: item.supported_endpoint_types
    // supported_text_delta 会在 processModelLikeAddModel 里设置
  }
}

// Model → ApiModel
function modelToApiModel(model: Model, provider: Provider): ApiModel {
  return {
    id: `${provider.id}:${model.id}`,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    name: model.name,
    owned_by: model.owned_by || provider.name,
    provider: provider.id,
    provider_name: provider.name,
    provider_type: provider.type,
    provider_model_id: model.id
  }
}

export function useNewApiModels(provider: Provider) {
  const [models, setModels] = useState<ApiModel[]>([])
  const [loading, setLoading] = useState(false)

  const loadModels = useCallback(async () => {
    setLoading(true)
    const allModels: Model[] = []
    let page = 1

    try {
      while (true) {
        const res = await fetch(`https://your-api.com/models?page=${page}&limit=50`, {
          headers: { Authorization: `Bearer ${provider.apiKey}` }
        })
        const data = await res.json()

        for (const item of data.items) {
          // 1. 转成 Model
          const model = transformToModel(item, provider)

          // 2. 应用 handleAddModel 的处理逻辑
          const processedModel = processModelLikeAddModel(model, provider)

          // 3. 应用 agentModelFilter（过滤掉不支持的模型类型）
          if (!agentModelFilter(processedModel)) {
            continue
          }

          allModels.push(processedModel)
        }

        if (!data.hasMore) break
        page++
      }

      // 4. 去重（复制 addModel reducer 的逻辑）
      const uniqueModels = uniqBy(allModels, 'id')

      // 5. 转成 ApiModel 格式
      const apiModels = uniqueModels.map((model) => modelToApiModel(model, provider))

      setModels(apiModels)
    } catch (error) {
      console.error('Failed to load models', error)
    } finally {
      setLoading(false)
    }
  }, [provider])

  return { models, loading, loadModels }
}
