import CollapsibleSearchBar from '@renderer/components/CollapsibleSearchBar'
import { HStack } from '@renderer/components/Layout'
import { DynamicVirtualList, type DynamicVirtualListRef } from '@renderer/components/VirtualList'
import { PROVIDER_URLS } from '@renderer/config/providers'
import { transformToModel, useAiOnlyModels } from '@renderer/hooks/useAiOnlyModels'
import { useProvider } from '@renderer/hooks/useProvider'
import { getProviderLabel } from '@renderer/i18n/label'
import { SettingHelpLink, SettingHelpText, SettingHelpTextRow, SettingSubtitle } from '@renderer/pages/settings'
import EditModelPopup from '@renderer/pages/settings/ProviderSettings/EditModelPopup/EditModelPopup'
// import AddModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/AddModelPopup'
// import DownloadOVMSModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/DownloadOVMSModelPopup'
// import ManageModelsPopup from '@renderer/pages/settings/ProviderSettings/ModelList/ManageModelsPopup'
// import NewApiAddModelPopup from '@renderer/pages/settings/ProviderSettings/ModelList/NewApiAddModelPopup'
import type { Model } from '@renderer/types'
import { filterModelsByKeywords } from '@renderer/utils'
import { getDuplicateModelNames } from '@renderer/utils/model'
// import { isNewApiProvider } from '@renderer/utils/provider'
import { Button, Divider, Empty, Flex, Radio, RadioChangeEvent, Space, Spin } from 'antd'
import { groupBy, isEmpty, sortBy, toPairs } from 'lodash'
import { RefreshCw } from 'lucide-react'
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import AiOnlyAddModelPopup from '../AiOnlyModel/add/AddModelPopup'
import ModelListGroup from './ModelListGroup'
import { useHealthCheck } from './useHealthCheck'

interface ModelListProps {
  providerId: string
  onPaginationStateChange?: (state: { fetchNextPage: () => void; loading: boolean; hasMore: boolean }) => void
}

enum ModelAttribute {
  TextModel = 'text_model',
  ImageModel = 'image_generation'
}

type ModelGroups = Record<string, Model[]>
const MODEL_COUNT_THRESHOLD = 10

/*const FlexContainer = styled(Flex)`
  /!* body 有 light 类名时的样式 *!/
  body.light & {
    background: #f1f1f1;
    padding: 15px;
    border-radius: 8px;
  }
`*/

const ModelListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 8px;
  background-color: var(--color-gray-4);
  padding: 16px;

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
const ModelList: React.FC<ModelListProps> = ({ providerId, onPaginationStateChange }) => {
  const { t } = useTranslation()
  // const { provider, models, removeModel } = useProvider(providerId)
  const { provider, removeModel } = useProvider(providerId)
  const [activeTabKey, setActiveTabKey] = useState('1')
  const typeTabs = [
    {
      key: ModelAttribute.TextModel,
      value: '1',
      label: t('settings.models.text_model'),
      style: { padding: '0 30px', fontSize: '12px' }
    },
    {
      key: ModelAttribute.ImageModel,
      value: '3',
      label: t('settings.models.image_model'),
      style: { padding: '0 30px', fontSize: '12px' }
    }
  ]

  const listRef = useRef<DynamicVirtualListRef>(null)

  const { getFilteredModels, loading, fetchNextPage, reset, hasMore } = useAiOnlyModels()

  const models = useMemo(() => {
    const modelList = getFilteredModels()
    return modelList.map((x: any) => transformToModel(x))
  }, [getFilteredModels])

  /*  const handleDynamicListChange = (instance: any) => {
    // 检测是否滚动到底部
    const scrollElement = instance.scrollElement
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < 50 && hasMore && !loading) {
        fetchNextPage() // 👈 触发加载更多
      }
    }
  }*/

  const onChange = (e: RadioChangeEvent) => {
    const type = (e.target as HTMLInputElement).value
    setActiveTabKey(type)

    const modelAttribute = typeTabs.find((tab) => tab.value === type)?.key

    reset({
      modelAttribute: modelAttribute as ModelAttribute,
      type
    })
  }

  // 稳定的编辑模型回调，避免内联函数导致子组件 memo 失效
  const handleEditModel = useCallback((model: Model) => EditModelPopup.show({ provider, model }), [provider])

  const providerConfig = PROVIDER_URLS[provider.id]
  const docsWebsite = providerConfig?.websites?.docs
  const modelsWebsite = providerConfig?.websites?.models

  const [_searchText, setSearchText] = useState('')
  const [displayedModelGroups, setDisplayedModelGroups] = useState<ModelGroups | null>(() => {
    if (models.length > MODEL_COUNT_THRESHOLD) {
      return null
    }
    return calculateModelGroups(models, '')
  })

  const { isChecking: isHealthChecking, modelStatuses /*runHealthCheck*/ } = useHealthCheck(provider, models)
  const duplicateModelNames = useMemo(() => getDuplicateModelNames(models), [models])

  // 将 modelStatuses 数组转换为 Map，实现 O(1) 查找
  const modelStatusMap = useMemo(() => {
    return new Map(modelStatuses.map((status) => [status.model.id, status]))
  }, [modelStatuses])

  const handleSetSearchText = useCallback(
    (text: string) => {
      startTransition(() => {
        setSearchText(text)
        reset({ modelName: text })
      })
    },
    [reset]
  )

  useEffect(() => {
    if (models.length > MODEL_COUNT_THRESHOLD) {
      startTransition(() => {
        setDisplayedModelGroups(calculateModelGroups(models, ''))
      })
    } else {
      setDisplayedModelGroups(calculateModelGroups(models, ''))
    }
  }, [models])

  // 将分页状态暴露给父组件
  useEffect(() => {
    if (onPaginationStateChange) {
      onPaginationStateChange({ fetchNextPage, loading, hasMore })
    }
  }, [onPaginationStateChange, fetchNextPage, loading, hasMore])

  /*const modelCount = useMemo(() => {
    return Object.values(displayedModelGroups ?? {}).reduce((acc, group) => acc + group.length, 0)
  }, [displayedModelGroups])*/

  const onManageModel = useCallback(async () => {
    // void ManageModelsPopup.show({ providerId: provider.id })
    const result = await AiOnlyAddModelPopup.show({ provider })
    if (result.success) {
      // 开通成功,result.modelIds 是本次开通的模型 id 列表
      // 刷新列表或其他操作
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  /*const onAddModel = useCallback(() => {
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
  }, [displayedModelGroups])*/

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
      <CollapsibleSearchBar
        onSearch={handleSetSearchText}
        placeholder={t('models.search.placeholder')}
        tooltip={t('models.search.tooltip')}
      />
      <Button type="text" onClick={() => reset()} icon={<RefreshCw size={16} />} disabled={isHealthChecking}></Button>
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
      </SettingSubtitle>

      <ModelListContainer>
        <Radio.Group
          value={activeTabKey}
          options={typeTabs}
          defaultValue="1"
          optionType="button"
          buttonStyle="solid"
          onChange={onChange}
        />
        {displayedModelGroups && !isEmpty(displayedModelGroups) && (
          <DynamicVirtualList
            ref={listRef}
            list={Object.keys(displayedModelGroups)}
            estimateSize={estimateSize} // 44px item + 8px padding
            overscan={5}
            scrollerStyle={{
              overflowY: 'hidden',
              height: 'auto',
              padding: '0'
            }}
            itemContainerStyle={{
              padding: '4px 0'
            }}
            /*onChange={handleDynamicListChange}*/
          >
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
        )}

        {isEmpty(displayedModelGroups) && (
          <Flex justify="center" align="center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Flex>
        )}
        <Spin size="small" spinning={loading} />
        {!hasMore && (
          <Divider
            size="small"
            style={{
              fontSize: '12px',
              color: 'var(--color-text-3)',
              marginBlock: '0'
            }}>
            {t('common.no_more')}
          </Divider>
        )}
      </ModelListContainer>
    </>
  )
}

export default memo(ModelList)
