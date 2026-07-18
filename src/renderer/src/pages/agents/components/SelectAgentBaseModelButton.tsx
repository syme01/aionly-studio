import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import { SelectAgentModelPopup } from '@renderer/components/Popups/SelectModelPopup'
import { agentModelFilter } from '@renderer/config/models'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import { selectAiOnlyModels } from '@renderer/store/user'
// import { useApiModel } from '@renderer/hooks/agents/useModel'
import type { AgentBaseWithId, ApiModel } from '@renderer/types'
import { isAgentSessionEntity } from '@renderer/types'
import { isAgentEntity } from '@renderer/types'
import { getModelFilterByAgentType } from '@renderer/utils/agentSession'
import { cacheAiOnlyModel } from '@renderer/utils/aionly-model-cache'
import type { ButtonProps } from 'antd'
import { Button } from 'antd'
import { ChevronDown } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

interface Props {
  agentBase: AgentBaseWithId
  onSelect: (model: ApiModel) => Promise<void>
  isDisabled?: boolean
  /** Custom className for the button */
  className?: string
  /** Custom inline styles for the button (merged with default styles) */
  buttonStyle?: CSSProperties
  /** Custom button size */
  buttonSize?: ButtonProps['size']
  /** Custom avatar size */
  avatarSize?: number
  /** Custom font size */
  fontSize?: number
  /** Custom icon size */
  iconSize?: number
  /** Custom className for the inner container (e.g., for justify-between) */
  containerClassName?: string
  selectedModel?: ApiModel | any
}

const SelectAgentBaseModelButton = ({
  agentBase: agent,
  onSelect,
  isDisabled,
  className,
  buttonStyle,
  buttonSize = 'small',
  avatarSize = 20,
  fontSize = 12,
  iconSize = 14,
  containerClassName,
  selectedModel
}: Props) => {
  const { t } = useTranslation()

  const { defaultModel } = useDefaultModel()
  // 获取 aiOnly 模型列表
  const aiOnlyModels = useSelector(selectAiOnlyModels)
  const matchedModel = aiOnlyModels?.find((model) => model.id === agent?.model?.replace('aionly:', ''))
  const apiModel = matchedModel ?? aiOnlyModels?.[0] ?? defaultModel

  // 如果传入了 selectedModel，使用它；否则从 API 获取
  // const apiModel = useApiModel({ id: agent?.model })
  // id aionly:doubao-seed-2-0-code-preview-260215
  const model = selectedModel || apiModel

  // console.log('agent', agent)

  // console.log('selectedModel', selectedModel)
  // console.log('apiModel', apiModel)
  // console.log('final model', model)

  const apiFilter = isAgentEntity(agent)
    ? getModelFilterByAgentType(agent.type)
    : isAgentSessionEntity(agent)
      ? getModelFilterByAgentType(agent.agent_type)
      : undefined

  if (!agent) return null

  // Only show fallback model if agent.model exists or user has explicitly selected
  // This prevents showing a misleading default when form.model is actually empty
  const shouldShowFallback = agent.model || selectedModel

  const onSelectModel = async () => {
    const selectedModel = await SelectAgentModelPopup.show({
      model,
      apiFilter: apiFilter,
      modelFilter: agentModelFilter
    })

    // console.log('selectedModel', selectedModel)
    // console.log('agent.model', agent.model)
    if (selectedModel && selectedModel.id !== agent.model) {
      cacheAiOnlyModel(selectedModel)
      void onSelect(selectedModel)
    }
  }

  // const providerName = model?.provider ? getProviderNameById(model.provider) : model?.provider_name

  // Merge default styles with custom styles
  const mergedStyle: CSSProperties = {
    borderRadius: 20,
    fontSize,
    padding: 2,
    ...buttonStyle
  }

  return (
    <Button
      size={buttonSize}
      type="text"
      className={className}
      style={mergedStyle}
      onClick={onSelectModel}
      disabled={isDisabled}>
      <div className={containerClassName || 'flex w-full items-center gap-1.5'}>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-hidden">
          {shouldShowFallback && model && <ModelAvatar model={model} size={avatarSize} />}
          <span className="truncate text-(--color-text)">
            {shouldShowFallback && model ? model.modelName || model.name : t('button.select_model')}
            {shouldShowFallback && model?.serviceName && (
              <span className="text-xs text-gray-500"> | {model?.serviceName}</span>
            )}
          </span>
        </div>
        <ChevronDown size={iconSize} color="var(--color-icon)" />
      </div>
    </Button>
  )
}

export default SelectAgentBaseModelButton
