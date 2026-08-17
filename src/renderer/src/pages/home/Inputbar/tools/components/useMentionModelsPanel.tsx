import { CrownFilled } from '@ant-design/icons'
import { selectTokenPlanHourlyDayUsageApi } from '@renderer/api/billManagement'
import ModelTagsWithLabel from '@renderer/components/ModelTagsWithLabel'
import type { QuickPanelListItem } from '@renderer/components/QuickPanel'
import { QuickPanelReservedSymbol } from '@renderer/components/QuickPanel'
import { getModelLogo, isEmbeddingModel, isRerankModel, isVisionModel } from '@renderer/config/models'
import db from '@renderer/databases'
import { transformToModel, useAiOnlyModels } from '@renderer/hooks/useAiOnlyModels'
import { useProviders } from '@renderer/hooks/useProvider'
import useUserTokenPlan from '@renderer/hooks/useUserTokenPlan'
import type { ToolQuickPanelApi, ToolQuickPanelController } from '@renderer/pages/home/Inputbar/types'
import { getModelUniqId } from '@renderer/services/ModelService'
import { useAppSelector } from '@renderer/store'
import { selectUserInfo } from '@renderer/store/user'
import type { FileMetadata, Model } from '@renderer/types'
import { FILE_TYPE } from '@renderer/types'
import { getFancyProviderName } from '@renderer/utils'
import { Avatar } from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { first, sortBy } from 'lodash'
import { AtSign, CircleX, Plus } from 'lucide-react'
import React, { useState } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

export type MentionTriggerInfo = { type: 'input' | 'button'; position?: number; originalText?: string }

interface Params {
  quickPanel: ToolQuickPanelApi
  quickPanelController: ToolQuickPanelController
  mentionedModels: Model[]
  setMentionedModels: React.Dispatch<React.SetStateAction<Model[]>>
  couldMentionNotVisionModel: boolean
  files: FileMetadata[]
  setText: React.Dispatch<React.SetStateAction<string>>
}

export const useMentionModelsPanel = (params: Params, role: 'button' | 'manager' = 'button') => {
  const {
    quickPanel,
    quickPanelController,
    mentionedModels,
    setMentionedModels,
    couldMentionNotVisionModel,
    files,
    setText
  } = params
  const { registerRootMenu, registerTrigger } = quickPanel
  const { open, close, updateList, isVisible, symbol } = quickPanelController
  const { providers } = useProviders()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const hasModelActionRef = useRef(false)
  const triggerInfoRef = useRef<MentionTriggerInfo | undefined>(undefined)
  const filesRef = useRef(files)

  // ----------------- user info and token plan -----------------
  const userInfo: any = useAppSelector(selectUserInfo)
  const { getUserEnabledPlan } = useUserTokenPlan(userInfo?.userId)
  const [tokenPlanModels, setTokenPlanModels] = useState<any[]>([])
  const [userEnabledPlan] = useState<any>(getUserEnabledPlan())

  const removeAtSymbolAndText = useCallback(
    (currentText: string, caretPosition: number, searchText?: string, fallbackPosition?: number) => {
      const safeCaret = Math.max(0, Math.min(caretPosition ?? 0, currentText.length))

      if (searchText !== undefined) {
        const pattern = '@' + searchText
        const fromIndex = Math.max(0, safeCaret - 1)
        const start = currentText.lastIndexOf(pattern, fromIndex)
        if (start !== -1) {
          const end = start + pattern.length
          return currentText.slice(0, start) + currentText.slice(end)
        }

        if (typeof fallbackPosition === 'number' && currentText[fallbackPosition] === '@') {
          const expected = pattern
          const actual = currentText.slice(fallbackPosition, fallbackPosition + expected.length)
          if (actual === expected) {
            return currentText.slice(0, fallbackPosition) + currentText.slice(fallbackPosition + expected.length)
          }
          return currentText.slice(0, fallbackPosition) + currentText.slice(fallbackPosition + 1)
        }

        return currentText
      }

      const fromIndex = Math.max(0, safeCaret - 1)
      const start = currentText.lastIndexOf('@', fromIndex)
      if (start === -1) {
        if (typeof fallbackPosition === 'number' && currentText[fallbackPosition] === '@') {
          let endPos = fallbackPosition + 1
          while (endPos < currentText.length && !/\s/.test(currentText[endPos])) {
            endPos++
          }
          return currentText.slice(0, fallbackPosition) + currentText.slice(endPos)
        }
        return currentText
      }

      let endPos = start + 1
      while (endPos < currentText.length && !/\s/.test(currentText[endPos])) {
        endPos++
      }
      return currentText.slice(0, start) + currentText.slice(endPos)
    },
    []
  )

  const onMentionModel = useCallback(
    (model: Model) => {
      const allowNonVision = !files.some((file) => file.type === FILE_TYPE.IMAGE)
      if (isVisionModel(model) || allowNonVision) {
        setMentionedModels((prev) => {
          const modelId = getModelUniqId(model)
          const exists = prev.some((m) => getModelUniqId(m) === modelId)
          return exists ? prev.filter((m) => getModelUniqId(m) !== modelId) : [...prev, model]
        })
        hasModelActionRef.current = true
      }
    },
    [files, setMentionedModels]
  )

  const onClearMentionModels = useCallback(() => {
    setMentionedModels([])
  }, [setMentionedModels])

  // 用户置顶模型
  const pinnedModels = useLiveQuery(
    async () => {
      const setting = await db.settings.get('pinned:models')
      return setting?.value || []
    },
    [],
    []
  )

  const {
    fetchNextPage: fetchNextAiOnlyPage,
    hasMore: hasMoreAiOnly,
    loading: aiOnlyLoading,
    getFilteredModels
  } = useAiOnlyModels({ autoFetch: !userEnabledPlan })

  // ----------------- tokenPlan models -----------------
  const fetchSelectTokenPlanHourlyDayUsage = async () => {
    try {
      // setLoading(true)
      const userSelectedPlan: any = getUserEnabledPlan()
      if (!userSelectedPlan) {
        // setLoading(false)
        return
      }
      const res: any = await selectTokenPlanHourlyDayUsageApi({
        subscribeId: userSelectedPlan.id,
        planId: userSelectedPlan.planId
      })
      const resData = res.rows || []
      const modelList = resData.map((item: any) => {
        return transformToModel(item)
      })
      setTokenPlanModels(modelList)
    } finally {
      // setLoading(false)
    }
  }

  useEffect(() => {
    fetchSelectTokenPlanHourlyDayUsage().then()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 获取aionly用户开通的所有文本模型
  const aionlyModelItems = useMemo(() => {
    const filteredModels = !userEnabledPlan ? getFilteredModels() : tokenPlanModels
    const items: QuickPanelListItem[] = []

    const pinnedAiOnlyModels = filteredModels.filter((m) => pinnedModels.includes(m.baseId || m.id))
    if (pinnedAiOnlyModels.length > 0) {
      const pinnedItems = pinnedAiOnlyModels.map((m) => {
        const model = transformToModel(m)
        return {
          label: (
            <>
              <ProviderName>{m.serviceName || m.group}</ProviderName>
              <span style={{ opacity: 0.8 }}> | {m.modelName}</span>
            </>
          ),
          description: <ModelTagsWithLabel model={model} showLabel={false} size={10} style={{ opacity: 0.8 }} />,
          icon: (
            <Avatar src={getModelLogo(model)} size={20}>
              {first(m.modelName)}
            </Avatar>
          ),
          filterText: (m.serviceName || m.group) + m.modelName,
          action: () => onMentionModel(model),
          isSelected: mentionedModels.some((selected) => getModelUniqId(selected) === getModelUniqId(model))
        }
      })
      items.push(...sortBy(pinnedItems, ['filterText']))
    }

    const nonPinnedItems = filteredModels
      .filter((m) => !pinnedModels.includes(m.baseId || m.id))
      .filter((m) => {
        const model = transformToModel(m)
        return couldMentionNotVisionModel || isVisionModel(model)
      })
      .map((m) => {
        const model = transformToModel(m)
        return {
          label: (
            <>
              <ProviderName>{m.serviceName || m.group}</ProviderName>
              <span style={{ opacity: 0.8 }}> | {m.modelName}</span>
              {m.memberSpecial == 1 && (
                <IconVip>
                  <CrownFilled />
                  <span>vip</span>
                </IconVip>
              )}
            </>
          ),
          description: <ModelTagsWithLabel model={model} showLabel={false} size={10} style={{ opacity: 0.8 }} />,
          icon: (
            <Avatar src={getModelLogo(model)} size={20}>
              {first(m.modelName)}
            </Avatar>
          ),
          filterText: (m.serviceName || m.group) + m.modelName,
          action: () => onMentionModel(model),
          isSelected: mentionedModels.some((selected) => getModelUniqId(selected) === getModelUniqId(model))
        }
      })
    items.push(...sortBy(nonPinnedItems, ['filterText']))

    items.push({
      label: t('settings.models.add.add_model') + '...',
      icon: <Plus />,
      action: () => navigate('/settings/provider'),
      isSelected: false
    })

    items.unshift({
      label: t('settings.input.clear.all'),
      description: t('settings.input.clear.models'),
      icon: <CircleX />,
      alwaysVisible: true,
      isSelected: false,
      action: ({ context }) => {
        onClearMentionModels()
        if (triggerInfoRef.current?.type === 'input') {
          setText((currentText) => {
            const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
            const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length
            return removeAtSymbolAndText(currentText, caret, undefined, triggerInfoRef.current?.position)
          })
        }
        context.close()
      }
    })

    return items
  }, [
    getFilteredModels,
    couldMentionNotVisionModel,
    mentionedModels,
    navigate,
    onClearMentionModels,
    onMentionModel,
    pinnedModels,
    removeAtSymbolAndText,
    setText,
    tokenPlanModels,
    t
  ])

  const modelItems = useMemo(() => {
    const items: QuickPanelListItem[] = []

    if (pinnedModels.length > 0) {
      const pinnedItems = providers.flatMap((provider) =>
        provider.models
          .filter((model) => !isEmbeddingModel(model) && !isRerankModel(model))
          .filter((model) => pinnedModels.includes(getModelUniqId(model)))
          .filter((model) => couldMentionNotVisionModel || (!couldMentionNotVisionModel && isVisionModel(model)))
          .map((model) => ({
            label: (
              <>
                <ProviderName>{getFancyProviderName(provider)}</ProviderName>
                <span style={{ opacity: 0.8 }}> | {model.name}</span>
              </>
            ),
            description: <ModelTagsWithLabel model={model} showLabel={false} size={10} style={{ opacity: 0.8 }} />,
            icon: (
              <Avatar src={getModelLogo(model)} size={20}>
                {first(model.name)}
              </Avatar>
            ),
            filterText: getFancyProviderName(provider) + model.name,
            action: () => onMentionModel(model),
            isSelected: mentionedModels.some((selected) => getModelUniqId(selected) === getModelUniqId(model))
          }))
      )

      if (pinnedItems.length > 0) {
        items.push(...sortBy(pinnedItems, ['label']))
      }
    }

    // console.log('providers', providers)

    providers.forEach((provider) => {
      const providerModels = sortBy(
        provider.models
          .filter((model) => !isEmbeddingModel(model) && !isRerankModel(model))
          .filter((model) => !pinnedModels.includes(getModelUniqId(model)))
          .filter((model) => couldMentionNotVisionModel || (!couldMentionNotVisionModel && isVisionModel(model))),
        ['group', 'name']
      )

      const providerItems = providerModels.map((model) => ({
        label: (
          <>
            <ProviderName>{getFancyProviderName(provider)}</ProviderName>
            <span style={{ opacity: 0.8 }}> | {model.name}</span>
          </>
        ),
        description: <ModelTagsWithLabel model={model} showLabel={false} size={10} style={{ opacity: 0.8 }} />,
        icon: (
          <Avatar src={getModelLogo(model)} size={20}>
            {first(model.name)}
          </Avatar>
        ),
        filterText: getFancyProviderName(provider) + model.name,
        action: () => onMentionModel(model),
        isSelected: mentionedModels.some((selected) => getModelUniqId(selected) === getModelUniqId(model))
      }))

      if (providerItems.length > 0) {
        items.push(...providerItems)
      }
    })

    items.push({
      label: t('settings.models.add.add_model') + '...',
      icon: <Plus />,
      action: () => navigate('/settings/provider'),
      isSelected: false
    })

    items.unshift({
      label: t('settings.input.clear.all'),
      description: t('settings.input.clear.models'),
      icon: <CircleX />,
      alwaysVisible: true,
      isSelected: false,
      action: ({ context }) => {
        onClearMentionModels()

        if (triggerInfoRef.current?.type === 'input') {
          setText((currentText) => {
            const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
            const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length
            return removeAtSymbolAndText(currentText, caret, undefined, triggerInfoRef.current?.position)
          })
        }

        context.close()
      }
    })

    return items
  }, [
    couldMentionNotVisionModel,
    mentionedModels,
    navigate,
    onClearMentionModels,
    onMentionModel,
    pinnedModels,
    providers,
    removeAtSymbolAndText,
    setText,
    t
  ])

  const openQuickPanel = useCallback(
    (triggerInfo?: MentionTriggerInfo) => {
      hasModelActionRef.current = false
      triggerInfoRef.current = triggerInfo

      open({
        title: t('assistants.presets.edit.model.select.title'),
        list: aionlyModelItems,
        symbol: QuickPanelReservedSymbol.MentionModels,
        multiple: true,
        triggerInfo: triggerInfo || { type: 'button' },
        afterAction({ item }) {
          item.isSelected = !item.isSelected
        },
        onClose({ action, searchText, context }) {
          if (action === 'esc') {
            const trigger = context?.triggerInfo ?? triggerInfoRef.current
            if (hasModelActionRef.current && trigger?.type === 'input' && trigger?.position !== undefined) {
              setText((currentText) => {
                const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
                const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length
                return removeAtSymbolAndText(currentText, caret, searchText || '', trigger?.position)
              })
            }
          }
          triggerInfoRef.current = undefined
        }
      })
    },
    [modelItems, open, removeAtSymbolAndText, setText, t]
  )

  const handleOpenQuickPanel = useCallback(() => {
    if (isVisible && symbol === QuickPanelReservedSymbol.MentionModels) {
      close()
    } else {
      openQuickPanel({ type: 'button' })
    }
  }, [close, isVisible, openQuickPanel, symbol])

  useEffect(() => {
    if (role !== 'manager') return
    if (filesRef.current !== files) {
      if (isVisible && symbol === QuickPanelReservedSymbol.MentionModels) {
        close()
      }
      filesRef.current = files
    }
  }, [close, files, isVisible, role, symbol])

  useEffect(() => {
    if (role !== 'manager') return
    if (isVisible && symbol === QuickPanelReservedSymbol.MentionModels) {
      updateList(modelItems)
    }
  }, [isVisible, modelItems, role, symbol, updateList])

  // 当 aiOnlyModels 分页加载更多数据时，同步刷新面板列表
  useEffect(() => {
    if (role !== 'manager') return
    if (isVisible && symbol === QuickPanelReservedSymbol.MentionModels) {
      updateList(aionlyModelItems)
    }
  }, [isVisible, aionlyModelItems, role, symbol, updateList])

  // 滚动加载：监听 QuickPanel 虚拟列表滚动，触底时请求下一页
  useEffect(() => {
    if (role !== 'manager') return
    if (!isVisible || symbol !== QuickPanelReservedSymbol.MentionModels) return

    const scrollEl = document.querySelector(
      '[data-testid="quick-panel"] .dynamic-virtual-list'
    ) as HTMLDivElement | null
    if (!scrollEl) return

    const onScroll = () => {
      if (aiOnlyLoading || !hasMoreAiOnly) return
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      if (scrollHeight - scrollTop - clientHeight < 50) {
        void fetchNextAiOnlyPage()
      }
    }

    scrollEl.addEventListener('scroll', onScroll)
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [isVisible, symbol, role, fetchNextAiOnlyPage, hasMoreAiOnly, aiOnlyLoading])

  useEffect(() => {
    if (role !== 'manager') return
    const disposeRootMenu = registerRootMenu([
      {
        label: t('assistants.presets.edit.model.select.title'),
        description: '',
        icon: <AtSign />,
        isMenu: true,
        action: () => openQuickPanel({ type: 'button' })
      }
    ])

    const disposeTrigger = registerTrigger(QuickPanelReservedSymbol.MentionModels, (payload) => {
      const trigger = (payload || {}) as MentionTriggerInfo
      openQuickPanel(trigger)
    })

    return () => {
      disposeRootMenu()
      disposeTrigger()
    }
  }, [openQuickPanel, registerRootMenu, registerTrigger, role, t])

  return {
    handleOpenQuickPanel,
    openQuickPanel
  }
}

const ProviderName = styled.span`
  font-weight: 500;
`
const IconVip = styled.div`
  display: inline-block;
  text-align: center;
  color: var(--color-white);
  width: 52px;
  padding: 2px 0;
  background: linear-gradient(90deg,#ffaa00 0%,#f77a1d 100%);
  border-radius: 4px;
  font-size: 12px;
  margin-left: 15px;
`
