import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { addApikey, deleteApikeyById, getApikeyList } from '@renderer/api/apikey'
import { TopView } from '@renderer/components/TopView'
import { maskApiKey } from '@renderer/utils'
import { Button, Modal, Table, TableProps, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  resolve: (value: any) => void
}

/**
 * API Key 列表弹窗容器组件
 */
const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [apiKeyList, setApiKeyList] = useState<any[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(true)

  const query = useRef({
    pageNum: 1,
    pageSize: 200,
    total: 0,
    appname: '',
    keyType: ''
  })

  const apikeyForm = {
    id: '',
    keyType: '标准模式',
    appname: '',
    apikey: '',
    remark: '',
    createTime: '',
    description: '',
    modelId: '',
    componentIds: [],
    knowledgeFlag: 1,
    knowledgeId: '',
    knowledgeReturn: 10,
    milvusType: '',
    promptVal: ''
  }

  const { t } = useTranslation()

  let timer: any = null

  const columns: TableProps<any>['columns'] = [
    {
      title: 'API KEY',
      dataIndex: 'apikey',
      key: 'apikey',
      render: (text) => (
        <Typography.Text style={{ color: 'blue' }} copyable={{ text }}>
          {maskApiKey(text)}
        </Typography.Text>
      )
    },
    {
      title: `${t('settings.translate.custom.table.action.title')}`,
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <DeleteOutlined style={{ fontSize: '16px', color: 'red' }} onClick={() => handleDelete(record)} />
      )
    }
  ]

  const handleDelete = (record) => {
    Modal.confirm({
      title: t('common.delete_confirm'),
      onOk: () => {
        toDel(record)
      }
    })
  }

  const toDel = async (record: any) => {
    const res = await deleteApikeyById({ id: record?.id })
    if (res.code === 200) {
      window.toast.success(t('common.delete_success'))
    }
    await fetchData()
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getApikeyList(query.current)
      setApiKeyList(res.rows)
      query.current.total = res.total
      setShowAdd(res.total < query.current.pageSize)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = async () => {
    setAddLoading(true)
    try {
      await addApikey(apikeyForm)
      await fetchData()
    } finally {
      timer = setTimeout(() => {
        setAddLoading(false)
      }, 2000)
    }
  }

  const onCancel = () => {
    setOpen(false)
    timer && clearTimeout(timer)
    timer = null
  }

  const onClose = () => {
    resolve(null)
  }

  const Footer = showAdd ? (
    <Button size="large" type="primary" onClick={handleAdd} icon={<PlusOutlined />} block={true} loading={addLoading}>
      {t('common.add')}
    </Button>
  ) : (
    <Typography.Text type="warning" style={{ fontSize: 12, padding: 0 }}>
      （{t('settings.provider.api_key.max_tip')}）
    </Typography.Text>
  )

  return (
    <Modal
      title={t('settings.provider.api.key.list.title')}
      open={open}
      onCancel={onCancel}
      afterClose={onClose}
      transitionName="animation-move-down"
      centered
      width={600}
      footer={Footer}>
      <Table dataSource={apiKeyList} columns={columns} pagination={false} loading={loading} rowKey="id" />
    </Modal>
  )
}

const TopViewKey = 'ApiKeyListPopup'

export default class ApiKeyListPopup {
  static topviewId = 0

  static hide() {
    TopView.hide(TopViewKey)
  }

  static show() {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            TopView.hide(TopViewKey)
          }}
        />,
        TopViewKey
      )
    })
  }
}
