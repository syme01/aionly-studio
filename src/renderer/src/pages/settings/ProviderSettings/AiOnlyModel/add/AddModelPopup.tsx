import './AddModelPop.css'

import { batchAddModelPayLaterApi } from '@renderer/api/balance'
import { listUnopenedPayLaterModelsApi } from '@renderer/api/openManagement'
import checkedImg from '@renderer/assets/images/checked.png'
import vipImg from '@renderer/assets/images/vipSign.png'
import { TopView } from '@renderer/components/TopView'
import type { Provider } from '@renderer/types'
import { Button, Checkbox, Empty, message, Modal, Radio, Spin } from 'antd'
import type { CheckboxGroupProps } from 'antd/es/checkbox'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ShowParams {
  provider: Provider
}

interface Props extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [curTabValue, setCurTabValue] = useState<string>('text_model')
  const [modelList, setModelList] = useState<any[]>([])
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const tabOptions: CheckboxGroupProps<string>['options'] = [
    { label: t('settings.models.text_model'), value: 'text_model' },
    { label: t('settings.models.image_model'), value: 'image_generation' }
  ]

  useEffect(() => {
    setLoading(true)
    setSelectedModelIds([])
    listUnopenedPayLaterModelsApi()
      .then((res: any) => {
        if (res && res.data && res.data.length > 0 && Array.isArray(res.data)) {
          setModelList(res.data)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /** 无 VIP 或调用权限的模型不可选（灰置） */
  const modelDisabled = (item: any) => {
    if (item.hasCallPermission === false) return true
    if (item.memberSpecial === '1' && item.hasVipPermission === false) return true
    return false
  }

  const filteredModels = modelList.filter((model) => model.modelAttribute === curTabValue)
  const selectableModels = filteredModels.filter((model) => !modelDisabled(model))
  const checkAll = selectableModels.length > 0 && selectedModelIds.length === selectableModels.length
  const indeterminate = selectedModelIds.length > 0 && selectedModelIds.length < selectableModels.length

  const handleModelClick = (model: any) => {
    if (modelDisabled(model)) {
      return
    }
    setSelectedModelIds((prev) =>
      prev.includes(model.id) ? prev.filter((id) => id !== model.id) : [...prev, model.id]
    )
  }

  const handleSelectAll = () => {
    setSelectedModelIds(checkAll ? [] : selectableModels.map((model) => model.id))
  }

  /** 开通模型 **/
  const handleActivateModel = async () => {
    setConfirmLoading(true)
    try {
      const res = await batchAddModelPayLaterApi({
        modelIds: selectedModelIds,
        autoOpenNewModel: false
      })
      if (res.code === 200 || res.code === 0) {
        message.success(res.msg || '开通成功')
        setOpen(false)
        resolve({ success: true, modelIds: selectedModelIds })
      }
    } catch (e) {
    } finally {
      setConfirmLoading(false)
    }
  }

  const onOk = useCallback(() => setOpen(false), [])

  const onCancel = useCallback(() => setOpen(false), [])

  const onClose = useCallback(() => resolve({}), [resolve])

  return (
    <Modal
      width="80%"
      title="添加模型"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      destroyOnHidden
      centered
      footer={() => (
        <Button
          type="primary"
          className="kt-btn"
          disabled={selectedModelIds.length === 0}
          loading={confirmLoading}
          onClick={handleActivateModel}>
          {t('settings.models.add.activate_model')}
        </Button>
      )}>
      <div className="tab-nav">
        <Radio.Group
          block
          value={curTabValue}
          options={tabOptions}
          optionType="button"
          buttonStyle="solid"
          onChange={(e) => {
            setCurTabValue(e.target.value)
            setSelectedModelIds([])
          }}
        />
      </div>
      <div className="desc">{t('settings.models.add.activate_desc')}</div>
      <div className="model-wrapper">
        <div className="flex items-center">
          <Checkbox indeterminate={indeterminate} checked={checkAll} onChange={handleSelectAll}>
            全选
          </Checkbox>
        </div>
        <div className="list">
          {filteredModels?.map((model: any) => (
            <div
              key={model.id}
              className={`item ${modelDisabled(model) ? 'disabled' : null} ${selectedModelIds.includes(model.id) ? 'selected' : ''}`}
              onClick={() => handleModelClick(model)}>
              <span>{model.modelName}</span>
              {selectedModelIds.includes(model.id) && (
                <img className="checked-img" src={checkedImg} alt={model.modelName} />
              )}
              {model.memberSpecial == '1' && <img src={vipImg} className="vip-img" alt="" />}
            </div>
          ))}
          {(loading || filteredModels.length <= 0) && (
            <div className="loading">
              <Spin>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Spin>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

const TopViewKey = 'AiOnlyAddModelPopup'

export default class AddModelPopup {
  static hide() {
    TopView.hide(TopViewKey)
  }

  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        TopViewKey
      )
    })
  }
}
