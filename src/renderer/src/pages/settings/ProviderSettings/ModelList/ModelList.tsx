import { pageListApi } from '@renderer/api/openManagement'
import { HStack } from '@renderer/components/Layout'
import { DynamicVirtualList, type DynamicVirtualListRef } from '@renderer/components/VirtualList'
import { PROVIDER_URLS } from '@renderer/config/providers'
import { useProvider } from '@renderer/hooks/useProvider'
import { getProviderLabel } from '@renderer/i18n/label'
import { SettingHelpLink, SettingHelpText, SettingHelpTextRow, SettingSubtitle } from '@renderer/pages/settings'
import EditModelPopup from '@renderer/pages/settings/ProviderSettings/EditModelPopup/EditModelPopup'
// import AddModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/AddModelPopup'
import DownloadOVMSModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/DownloadOVMSModelPopup'
// import ManageModelsPopup from '@renderer/pages/settings/ProviderSettings/ModelList/ManageModelsPopup'
import NewApiAddModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/NewApiAddModelPopup'
import type { Model } from '@renderer/types'
import { filterModelsByKeywords } from '@renderer/utils'
import { getDuplicateModelNames } from '@renderer/utils/model'
import { isNewApiProvider } from '@renderer/utils/provider'
import { Button, Empty, Flex, Space, Spin, Tabs } from 'antd'
import { groupBy, isEmpty, sortBy, toPairs } from 'lodash'
import { RefreshCw } from 'lucide-react'
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import AiOnlyAddModelPopup from '../AiOnlyModel/add/AddModelPopup'
import ModelListGroup from './ModelListGroup'
import { useHealthCheck } from './useHealthCheck'

interface ModelListProps {
  providerId: string
}

enum ModelAttribute {
  TextModel = 'text_model',
  ImageModel = 'image_generation'
}

interface ModelPageParams {
  type: string
  modelAttribute: ModelAttribute
  pageNum: number
  pageSize: number
  total: number
  orderByStatus: number // 1=先有效再停用再失效/下架（或后端约定的枚举）
  orderByTime: string // 有效组内按时间倒序
  domain: string
}

type ModelGroups = Record<string, Model[]>
const MODEL_COUNT_THRESHOLD = 10

const FlexContainer = styled(Flex)`
  /* body 有 light 类名时的样式 */
  body.light & {
    background: #f1f1f1;
    padding: 15px;
    border-radius: 8px;
  }
`

const ModelListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
  /* body 有 light 类名时的样式 */
  body.light & {
    background: #f1f1f1;
    //padding: 10px 5px 10px 10px;
    border-radius: 8px;
  }

  .ant-collapse-content{
    padding: 15px;
  }
`

/**
 * 根据搜索文本筛选模型、分组并排序
 */
const calculateModelGroups = (models: Model[], searchText: string): ModelGroups => {
  // 只显示"先用后付"的模型
  const payLaterModels = models.filter((m: any) => m.packageNum === '先用后付')
  const filteredModels = searchText ? filterModelsByKeywords(searchText, payLaterModels) : payLaterModels
  const grouped = groupBy(filteredModels, 'group')
  return sortBy(toPairs(grouped), [0]).reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

/**
 * 模型列表组件，用于 CRUD 操作和健康检查
 */
const ModelList: React.FC<ModelListProps> = ({ providerId }) => {
  const { t } = useTranslation()
  // const { provider, models, removeModel } = useProvider(providerId)
  const { provider, removeModel } = useProvider(providerId)
  const [activeTabKey, setActiveTabKey] = useState(ModelAttribute.TextModel)
  const typeTabs = [
    {
      key: ModelAttribute.TextModel,
      type: '1',
      label: t('settings.models.text_model'),
      children: null
    },
    {
      key: ModelAttribute.ImageModel,
      type: '3',
      label: t('settings.models.image_model'),
      children: null
    }
  ]
  const onChange = (key: string) => {
    setActiveTabKey(key as ModelAttribute)
    // 切换 tab 时重置列表并重新请求
    setModels([])
    const type = typeTabs.find((item) => item.key === key)?.type || ''
    setModelPageParams((prev) => ({
      ...prev,
      modelAttribute: key as ModelAttribute,
      type,
      pageNum: 1,
      total: 0
    }))
    // 使用 queueMicrotask 确保 ref 已同步后再请求
    queueMicrotask(() => {
      pageParamsRef.current = { ...pageParamsRef.current, type, pageNum: 1, total: 0 }
      fetchModels(1)
    })
  }
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const modelsLengthRef = useRef(0)
  const pageParamsRef = useRef<ModelPageParams>({
    type: '1',
    modelAttribute: ModelAttribute.TextModel,
    pageNum: 1,
    pageSize: 10,
    total: 0,
    orderByStatus: 1,
    orderByTime: 'desc',
    domain: window.location.hostname
  })

  const listRef = useRef<DynamicVirtualListRef>(null)

  // TODO 模型数据源
  const [models, setModels] = useState<any>([])
  const [modelPageParams, setModelPageParams] = useState<ModelPageParams>(pageParamsRef.current)

  // 保持 ref 与 state 同步，供事件回调读取最新值（避免闭包陷阱）
  useEffect(() => {
    pageParamsRef.current = modelPageParams
  }, [modelPageParams])

  // TODO 模型列表数据源接口
  const fetchModels = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const params = { ...pageParamsRef.current, pageNum }
      const res: any = await pageListApi(params)
      if (res?.code == 200) {
        const data = res.rows || []
        const modelList = data.map((item: any) => ({
          ...item,
          name: item.modelName,
          provider: 'aionly',
          group: item.serviceName
        }))
        if (modelList.length > 0) {
          // 使用 queueMicrotask 避免在渲染周期内调用 setState
          queueMicrotask(() => {
            setModels((prevModels: any[]) => [...prevModels, ...modelList])
            setModelPageParams((prev) => ({ ...prev, total: res.total, pageNum }))
          })
        }
      }
    } catch (e) {
      throw new Error(e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  // 将最新 models.length 同步到 ref，供 onChange 回调读取（避免闭包过时值）
  useEffect(() => {
    modelsLengthRef.current = models.length
  }, [models.length])

  useEffect(() => {
    fetchModels(1)
  }, [fetchModels])

  // 稳定的编辑模型回调，避免内联函数导致子组件 memo 失效
  const handleEditModel = useCallback((model: Model) => EditModelPopup.show({ provider, model }), [provider])

  const providerConfig = PROVIDER_URLS[provider.id]
  const docsWebsite = providerConfig?.websites?.docs
  const modelsWebsite = providerConfig?.websites?.models

  const [searchText, _setSearchText] = useState('')
  const [displayedModelGroups, setDisplayedModelGroups] = useState<ModelGroups | null>(() => {
    if (models.length > MODEL_COUNT_THRESHOLD) {
      return null
    }
    return calculateModelGroups(models, '')
  })

  const { isChecking: isHealthChecking, modelStatuses, runHealthCheck } = useHealthCheck(provider, models)
  const duplicateModelNames = useMemo(() => getDuplicateModelNames(models), [models])

  // 将 modelStatuses 数组转换为 Map，实现 O(1) 查找
  const modelStatusMap = useMemo(() => {
    return new Map(modelStatuses.map((status) => [status.model.id, status]))
  }, [modelStatuses])

  const setSearchText = useCallback((text: string) => {
    startTransition(() => {
      _setSearchText(text)
    })
  }, [])

  useEffect(() => {
    if (models.length > MODEL_COUNT_THRESHOLD) {
      startTransition(() => {
        setDisplayedModelGroups(calculateModelGroups(models, searchText))
      })
    } else {
      setDisplayedModelGroups(calculateModelGroups(models, searchText))
    }
  }, [models, searchText])

  const modelCount = useMemo(() => {
    return Object.values(displayedModelGroups ?? {}).reduce((acc, group) => acc + group.length, 0)
  }, [displayedModelGroups])

  const onManageModel = useCallback(async () => {
    // void ManageModelsPopup.show({ providerId: provider.id })
    const result = await AiOnlyAddModelPopup.show({ provider })
    if (result.success) {
      // 开通成功,result.modelIds 是本次开通的模型 id 列表
      // 刷新列表或其他操作
    }
  }, [provider])

  const onAddModel = useCallback(() => {
    if (isNewApiProvider(provider)) {
      void NewApiAddModelPopup.show({ title: t('settings.models.add.add_model'), provider })
    } else {
      void AddModelPopup.show({ title: t('settings.models.add.add_model'), provider })
    }
  }, [provider, t])

  const onDownloadModel = useCallback(
    () => DownloadOVMSModelPopup.show({ title: t('ovms.download.title'), provider }),
    [provider, t]
  )

  const isLoading = useMemo(() => displayedModelGroups === null, [displayedModelGroups])
  const hasNoModels = useMemo(() => models.length === 0, [models.length])

  const groupKeys = useMemo(() => {
    return displayedModelGroups ? Object.keys(displayedModelGroups) : []
  }, [displayedModelGroups])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      // 距底部 50px 以内触发加载
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (loadingRef.current) return
        const { pageNum, pageSize, total } = pageParamsRef.current
        if (models.length >= total) return
        loadingRef.current = true
        fetchModels(pageNum + 1)
      }
    },
    [models.length, fetchModels]
  )

  const estimateSize = useCallback(() => 52, [])

  const actionButtons = (
    /*<Space.Compact>
      <Button onClick={onManageModel} icon={<RefreshCw size={16} />} disabled={isHealthChecking}>
        {t('settings.models.manage.fetch_list')}
      </Button>
      {provider.id !== 'ovms' ? (
        <Tooltip title={t('button.add')} mouseLeaveDelay={0}>
          <Button onClick={onAddModel} icon={<Plus size={16} />} disabled={isHealthChecking} />
        </Tooltip>
      ) : (
        <Tooltip title={t('button.download')} mouseLeaveDelay={0}>
          <Button onClick={onDownloadModel} icon={<Plus size={16} />} />
        </Tooltip>
      )}
    </Space.Compact>*/

    <Space>
      {/*<CollapsibleSearchBar
        onSearch={setSearchText}
        placeholder={t('models.search.placeholder')}
        tooltip={t('models.search.tooltip')}
      />*/}
      <Button type="text" onClick={onManageModel} icon={<RefreshCw size={16} />} disabled={isHealthChecking}></Button>
      <Button type="primary" onClick={onManageModel} disabled={isHealthChecking}>
        {t('settings.models.manage.add_model')}
      </Button>
    </Space>
  )

  return (
    <>
      <SettingSubtitle style={{ marginBottom: 12 }}>
        <HStack alignItems="center" justifyContent="space-between" style={{ width: '100%' }}>
          <HStack alignItems="center" gap={8}>
            <SettingSubtitle style={{ marginTop: 0 }}>{t('common.models')}</SettingSubtitle>
            {/*<CustomTag color="#8c8c8c" size={10}>
              {modelCount}
            </CustomTag>*/}
            <Flex justify="space-between" align="center">
              {docsWebsite || modelsWebsite ? (
                <SettingHelpTextRow>
                  <SettingHelpText>{t('settings.provider.docs_check')} </SettingHelpText>
                  {docsWebsite && (
                    <SettingHelpLink target="_blank" href={docsWebsite}>
                      {getProviderLabel(provider.id) + ' '}
                      {t('common.docs')}
                    </SettingHelpLink>
                  )}
                  {docsWebsite && modelsWebsite && <SettingHelpText>{t('common.and')}</SettingHelpText>}
                  {modelsWebsite && (
                    <SettingHelpLink target="_blank" href={modelsWebsite}>
                      {t('common.models')}
                    </SettingHelpLink>
                  )}
                  <SettingHelpText>{t('settings.provider.docs_more_details')}</SettingHelpText>
                </SettingHelpTextRow>
              ) : (
                <div style={{ height: 5 }} />
              )}
            </Flex>
            {/*{!hasNoModels && (
              <>
                <Tooltip title={t('settings.models.check.button_caption')} mouseLeaveDelay={0}>
                  <Button
                    type="text"
                    onClick={runHealthCheck}
                    icon={
                      <StreamlineGoodHealthAndWellBeing
                        size={16}
                        isActive={isHealthChecking}
                        color="var(--color-icon)"
                      />
                    }
                  />
                </Tooltip>
              </>
            )}*/}
          </HStack>
          {actionButtons}
        </HStack>
        <Tabs activeKey={activeTabKey} items={typeTabs} onChange={onChange} />
      </SettingSubtitle>
      <Spin spinning={loading}>
        {displayedModelGroups && !isEmpty(displayedModelGroups) && (
          <ModelListContainer onScroll={handleScroll}>
            <DynamicVirtualList
              ref={listRef}
              list={Object.keys(displayedModelGroups)}
              estimateSize={estimateSize} // 44px item + 8px padding
              overscan={5}
              scrollerStyle={{
                overflow: 'visible',
                height: 'auto',
                padding: '4px 6px 4px 12px'
              }}
              itemContainerStyle={{
                padding: '4px 0'
              }}>
              {(group) => (
                <ModelListGroup
                  key={group}
                  groupName={group}
                  models={displayedModelGroups[group]}
                  duplicateModelNames={duplicateModelNames}
                  modelStatusMap={modelStatusMap}
                  defaultOpen={true}
                  onEditModel={handleEditModel}
                  onRemoveModel={removeModel}
                  onRemoveGroup={() => displayedModelGroups[group].forEach((model) => removeModel(model))}
                />
              )}
            </DynamicVirtualList>
          </ModelListContainer>
        )}

        {isEmpty(displayedModelGroups) && (
          <Flex justify="center" align="center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Flex>
        )}
      </Spin>
    </>
  )
}

export default memo(ModelList)
