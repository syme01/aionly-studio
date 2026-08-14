import { selectTokenPlanHourlyDayUsageApi } from '@renderer/api/billManagement'
import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import { ModelAttribute, transformToModel, useAiOnlyModels } from '@renderer/hooks/useAiOnlyModels'
import useUserTokenPlan from '@renderer/hooks/useUserTokenPlan'
import { useAppSelector } from '@renderer/store'
import { selectUserInfo } from '@renderer/store/user'
// import { getModelUniqId } from '@renderer/services/ModelService'
import type { Model, Provider } from '@renderer/types'
import { matchKeywordsInString } from '@renderer/utils'
// import { getFancyProviderName } from '@renderer/utils/naming'
import type { SelectProps } from 'antd'
import { Avatar, Select, Spin } from 'antd'
// import { sortBy } from 'lodash'
import type { BaseSelectRef } from 'rc-select'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ModelOption {
  label: React.ReactNode
  title: string
  value: string
}

interface GroupedModelOption {
  label: string
  title: string
  options: ModelOption[]
}

type SelectOption = ModelOption | GroupedModelOption

interface ModelSelectorProps extends SelectProps {
  providers?: Provider[]
  predicate?: (model: Model) => boolean
  grouped?: boolean
  showAvatar?: boolean
  showSuffix?: boolean
  autoFetch?: boolean
  apiModels?: any[] | null | undefined
}

/**
 * 模型选择器，封装了 antd Select
 * - 通过传入模型服务商列表和模型 predicate 来构造选项
 * - 支持按服务商分组
 * - 可以控制 avatar 和 suffix 显示与否
 * @param providers 服务商列表
 * @param predicate 模型过滤条件
 * @param grouped 是否按服务商分组
 * @param showAvatar 是否显示模型图标
 * @param showSuffix 是否在模型名称后显示服务商作为后缀
 */
const ModelSelector = ({
  // providers,
  predicate,
  grouped = true,
  showAvatar = true,
  // showSuffix = true,
  autoFetch = true,
  apiModels,
  loading: externalLoading,
  ref,
  ...props
}: ModelSelectorProps & { ref?: React.Ref<BaseSelectRef> | null }) => {
  const { t } = useTranslation()

  const userInfo: any = useAppSelector(selectUserInfo)
  const { getUserEnabledPlan } = useUserTokenPlan(userInfo?.userId)
  const [tokenPlanModels, setTokenPlanModels] = useState<any[]>([])
  const [userEnabledPlan] = useState<any>(getUserEnabledPlan())

  // 单个 provider 的模型选项
  /*const getModelOptions = useCallback(
    (p: Provider, fancyName: string) => {
      const suffix = showSuffix ? <span style={{ opacity: 0.45 }}>{` | ${fancyName}`}</span> : null
      return sortBy(p.models, 'name')
        .filter((model) => predicate?.(model) ?? true)
        .map((m) => ({
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {showAvatar && <ModelAvatar model={m} size={18} />}
              <span>
                {m.name}
                {suffix}
              </span>
            </div>
          ),
          title: `${m.name} | ${fancyName}`,
          value: getModelUniqId(m)
        }))
    },
    [predicate, showAvatar, showSuffix]
  )

  // 所有 provider 的模型选项
  const options = useMemo((): SelectOption[] => {
    if (!providers) return []

    if (grouped) {
      return providers.flatMap((p) => {
        const fancyName = getFancyProviderName(p)
        const modelOptions = getModelOptions(p, fancyName)
        return modelOptions.length > 0
          ? [
              {
                label: fancyName,
                title: p.name,
                options: modelOptions
              } as GroupedModelOption
            ]
          : []
      })
    }
    return providers.flatMap((p) => getModelOptions(p, getFancyProviderName(p)))
  }, [providers, grouped, getModelOptions])*/

  const labelRender = useCallback(
    (props) => {
      const { label } = props
      if (label) {
        return label
      } else {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showAvatar && <Avatar size={18} />}
            <span>{t('knowledge.error.model_invalid')}</span>
          </div>
        )
      }
    },
    [showAvatar, t]
  )

  /** 从接口查询文本模型 **/
  // 只有 userEnabledPlan 有值时才调用 useAiOnlyModels
  const { loading, setLoading, getFilteredModels, handleScroll } = useAiOnlyModels({
    pageSize: 20,
    autoFetch: autoFetch && !userEnabledPlan, // 用户启用了tokenPlan后，不需要走这个接口
    type: '1',
    modelAttribute: ModelAttribute.TextModel
  })

  // TODO: 当用户启用了tokenPlan时，查询套餐下的模型数据
  const fetchSelectTokenPlanHourlyDayUsage = async () => {
    try {
      setLoading(true)
      const userSelectedPlan: any = getUserEnabledPlan()
      if (!userSelectedPlan) {
        setLoading(false)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    const userSelectedPlan: any = getUserEnabledPlan()
    if (!!userSelectedPlan) {
      fetchSelectTokenPlanHourlyDayUsage().then()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEnabledPlan?.id, userEnabledPlan?.planId])

  // 将 AiOnlyModel 转换为 ModelOption
  const getAiOnlyModelOption = useCallback(
    (m: any, serviceName: string) => {
      // 构造符合 getModelUniqId 格式的 value
      const modelValue = JSON.stringify({
        id: m.model || m.baseId,
        provider: 'aionly',
        group: serviceName,
        name: m.modelName,
        modelFileUrl: m.modelFileUrl
      })
      return {
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showAvatar && <ModelAvatar model={m} size={18} />}
            <span>{m.modelName}</span>
          </div>
        ),
        title: `${m.modelName} | ${serviceName}`,
        value: modelValue
      }
    },
    [showAvatar]
  )

  // 构建 AiOnly 模型选项，优先使用父组件传入的 apiModels，否则从 hook 获取
  const aionlyOptions = useMemo((): SelectOption[] => {
    let filteredModels = !!userEnabledPlan ? tokenPlanModels : (apiModels ?? getFilteredModels())

    // 应用 predicate 过滤
    if (predicate) {
      filteredModels = filteredModels.filter(predicate)
    }

    if (grouped) {
      // 按 serviceName 分组
      const groupMap = new Map<string, any[]>()
      filteredModels.forEach((m) => {
        const serviceName = m.serviceName || 'Unknown'
        if (!groupMap.has(serviceName)) {
          groupMap.set(serviceName, [])
        }
        groupMap.get(serviceName)!.push(m)
      })

      const result = Array.from(groupMap.entries()).map(([serviceName, groupModels]) => ({
        label: serviceName,
        title: serviceName,
        options: groupModels.map((m) => getAiOnlyModelOption(m, serviceName))
      }))
      return result
    }

    // 不分组，直接返回所有模型
    const result = filteredModels.map((m) => getAiOnlyModelOption(m, m.serviceName || 'Unknown'))
    return result
  }, [tokenPlanModels, apiModels, getFilteredModels, grouped, getAiOnlyModelOption, predicate, userEnabledPlan])

  const handlePopupRender = useCallback(
    (menu) => {
      return <Spin spinning={externalLoading ?? loading}>{menu}</Spin>
    },
    [externalLoading, loading]
  )

  // 只有在没有 userEnabledPlan 时才启用滚动加载
  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!userEnabledPlan) {
        handleScroll(e)
      }
    },
    [userEnabledPlan, handleScroll]
  )

  return (
    <Select
      ref={ref}
      options={aionlyOptions}
      filterOption={modelSelectFilter}
      labelRender={labelRender}
      showSearch
      loading={loading}
      onPopupScroll={handlePopupScroll}
      popupRender={handlePopupRender}
      {...props}
    />
  )
}

export default memo(ModelSelector)

/**
 * 用于 antd Select 组件的 filterOption，统一搜索行为：
 * - 优先使用 title 匹配
 * - 其次使用 label 匹配
 * - 最后使用 value 匹配
 *
 * @param input 用户输入的搜索字符串
 * @param option Select 选项对象，包含 label 或 value
 * @returns 是否匹配
 */
export function modelSelectFilter(input: string, option: any): boolean {
  const target =
    typeof option?.title === 'string'
      ? option.title
      : typeof option?.label === 'string'
        ? option.label
        : typeof option?.value === 'string'
          ? option.value
          : ''
  return matchKeywordsInString(input, target)
}
