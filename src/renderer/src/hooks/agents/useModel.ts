import type { ApiModel, ApiModelsFilter } from '@renderer/types'
import { getCachedAiOnlyModel } from '@renderer/utils/aionly-model-cache'

import { useApiModels } from './useModels'

export type UseModelProps = {
  id?: string
  filter?: ApiModelsFilter
}

export const useApiModel = ({ id, filter }: UseModelProps): ApiModel | undefined => {
  const { models } = useApiModels(filter)
  // console.log('useApiModel', id, models)

  const foundModel = models.find((model) => model.id === id)

  // If model not found and it's an aionly model, try to get from cache
  // This handles the case where aionly models are dynamically fetched from external API
  // and not stored in Redux, so they won't appear in the models list
  if (id?.startsWith('aionly:')) {
    // console.log('useApiModel: not found in models, trying cache', id)
    const cachedModel = getCachedAiOnlyModel(id)
    if (cachedModel) {
      // console.log('useApiModel: found in cache', cachedModel)
      return cachedModel
    }

    // If not in cache, return a minimal placeholder
    const modelId = id.replace('aionly:', '')
    return {
      id: id,
      object: 'model',
      created: Date.now(),
      name: modelId, // Use model ID as name placeholder
      owned_by: 'AiOnly',
      provider: 'aionly',
      provider_name: 'AiOnly',
      provider_type: 'openai',
      provider_model_id: modelId
    }
  }

  return foundModel
}
