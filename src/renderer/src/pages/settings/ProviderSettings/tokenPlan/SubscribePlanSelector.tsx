import { getIndexTokenPlanPageListApi } from '@renderer/api/balance'
import { loggerService } from '@renderer/services/LoggerService'
import { Progress, Select, Tooltip } from 'antd'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const logger = loggerService.withContext('SubscribePlanSelector')

interface SubscribePlanSelectorProps {
  value?: string
  onChange?: (value: string, option: any) => void
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
}

const SubscribePlanSelector: FC<SubscribePlanSelectorProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  style
}) => {
  const { t } = useTranslation()
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const queryParams = useRef({
    pageNum: 1,
    pageSize: 10,
    total: 0,
    status: 2
  })

  /** 获取订阅套餐列表 */
  const fetchOptions = useCallback(
    async (reset: boolean = false) => {
      if (loading) return
      if (!reset && !hasMore) return

      try {
        setLoading(true)

        if (reset) {
          queryParams.current.pageNum = 1
        }

        const res = await getIndexTokenPlanPageListApi(queryParams.current)
        const rows: any[] = res?.rows || []
        const total = res?.total || 0

        queryParams.current.total = total

        setOptions((prevOptions) => {
          const newOptions = reset ? rows : [...prevOptions, ...rows]

          // 判断是否还有更多数据
          setHasMore(newOptions.length < total)

          return newOptions
        })

        // 准备下一页
        queryParams.current.pageNum += 1
      } catch (error: any) {
        logger.error('Failed to fetch subscribe plan options', error)
      } finally {
        setLoading(false)
      }
    },
    [loading, hasMore]
  )

  /** 处理下拉框滚动加载更多 */
  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      if (!target) return

      const { scrollTop, scrollHeight, clientHeight } = target

      // 距离底部小于 50px 时触发加载
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (hasMore && !loading) {
          fetchOptions(false)
        }
      }
    },
    [hasMore, loading, fetchOptions]
  )

  /** 初始加载 */
  useEffect(() => {
    fetchOptions(true).then()
  }, [])

  /** 清理防抖函数 */
  useEffect(() => {
    return () => {
      // 组件卸载时的清理
    }
  }, [])

  const mapPriceType = useCallback(
    (priceType: string) => {
      const text = `settings.provider.api_key.type.token_plan.${priceType}`
      return text ? t(text) : ''
    },
    [t]
  )

  const getUsagePercent = (row: any) => {
    const { creditsRest, creditsTotal, status, paymentStatus } = row
    if (status == 3 || paymentStatus == '1') return 0
    const safeTotal = Number(creditsTotal) || 0
    const safeRest = Number(creditsRest) || 0
    if (!safeTotal) return 0
    // 计算剩余额度百分比：剩余额度 / 总额度 * 100
    // 保留两位小数以提高精度
    const percent = (safeRest / safeTotal) * 100
    return Math.max(0, Math.min(Math.round(percent * 100) / 100, 100))
  }

  /** 计算总天数 */
  const calculateTotalDays = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return '--'
    try {
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      if (isNaN(start) || isNaN(end)) return '--'
      const diffTime = end - start
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : '--'
    } catch (error) {
      return '--'
    }
  }

  /** 计算距今剩余天数 */
  const calculateRemainingDays = (endTime: string) => {
    if (!endTime) return '--'
    try {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      if (isNaN(end)) return '--'
      const diffTime = end - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) return 0
      return diffDays
    } catch (error) {
      return '--'
    }
  }

  /** 自定义渲染选项 */
  const optionRender = useCallback(
    (option: any) => {
      const data = option.data
      return (
        <CustomRenderOption>
          <span>{data.planName}</span>
          <ClassifyTag>{data.classifyName}</ClassifyTag>
          <div className="row">
            <div className="item price">
              <div>{t('settings.provider.api_key.type.token_plan.price')}：</div>
              <div>
                <b className="money">${data.totalAmount}</b>/{mapPriceType(data.priceType)}
              </div>
            </div>
            <div className="item credits">
              <div>{t('settings.provider.api_key.type.token_plan.credits')}：</div>
              <div style={{ width: 150, flexShrink: 0 }}>
                <Tooltip
                  title={`${data.paymentStatus == '1' ? 0 : data.creditsRest || 0}/${data.paymentStatus == '1' ? 0 : data.creditsTotal || 0}`}>
                  <Progress percent={getUsagePercent(data)} status="normal" size="small" style={{ margin: 0 }} />
                </Tooltip>
                {/*<div className="usage-text">
                剩{ data.paymentStatus == '1' ? 0 : data.creditsRest || 0 }/共{ data.paymentStatus == '1' ? 0 : data.creditsTotal || 0 }
              </div>*/}
              </div>
            </div>
            <div className="item">
              <div>{t('settings.provider.api_key.type.token_plan.effective')}：</div>
              {data.effectiveStartTime || data.effectiveEndTime ? (
                <div className="">
                  {data.paymentStatus === '2' && (
                    <Tooltip title={`${data.effectiveStartTime} ~ ${data.effectiveEndTime}`}>
                      <div className="date-row num days">
                        {t('settings.provider.api_key.type.token_plan.total')}
                        {calculateTotalDays(data.effectiveStartTime, data.effectiveEndTime)}
                        {t('settings.provider.api_key.type.token_plan.custom')}/
                        {t('settings.provider.api_key.type.token_plan.remaining')}
                        {calculateRemainingDays(data.effectiveEndTime)}
                        {t('settings.provider.api_key.type.token_plan.custom')}
                      </div>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span>--</span>
              )}
            </div>
          </div>
        </CustomRenderOption>
      )
    },
    [mapPriceType, t]
  )

  /** 处理值变化 */
  const handleChange = useCallback(
    (val: string, opt: any) => {
      onChange?.(val, opt)
    },
    [onChange]
  )

  return (
    <Select
      value={value}
      onChange={handleChange}
      placeholder={placeholder || t('settings.provider.api_key.type.token_plan.subscribe_placeholder')}
      disabled={disabled}
      style={style}
      options={options}
      optionRender={optionRender}
      loading={loading}
      fieldNames={{ label: 'planName', value: 'id' }}
      onPopupScroll={handlePopupScroll}
    />
  )
}

const CustomRenderOption = styled.div`

  .row{
    display: flex;
    //align-items: center;
    gap: 10px;
    color: var(--color-text-2);
    font-size: 13px;
    >.item{
      display: flex;
    }

    .credits{
      .ant-progress {
        line-height: 1;
      }

      .ant-progress-outer {
        padding-right: 0;
        margin-right: 0;
      }

      .ant-progress-inner {
        background-color: rgba(0, 0, 0, 0.06) !important;
        border-radius: 100px;
      }

      .ant-progress-bg {
        border-radius: 100px;
        background-color: #1890ff !important;
      }
    }

    .usage-text{
      font-size: 12px;
      color: var(--color-text-3);
      transform: scale(0.8);
    }
  }

  .money{
    color: #f00;
  }
`

const ClassifyTag = styled.div`
  display: inline-block;
  padding: 0 4px;
  background-color: var(--color-list-item);
  color: var(--color-primary);
  font-size: 12px;
  transform: scale(0.8);
  border-radius: 30px;
`

export default SubscribePlanSelector
