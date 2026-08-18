import { Progress } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  userSelectedTokenPlan: any
}

const TokenPlanInfo: FC<Props> = ({ userSelectedTokenPlan }) => {
  const { t } = useTranslation()
  const [percent, setPercent] = useState(0)

  const getUsagePercent = (record: any) => {
    if (!record) return 0
    const { creditsRest, creditsTotal, status, paymentStatus } = record
    if (status == 3 || paymentStatus == '1') return 0
    const safeTotal = Number(creditsTotal) || 0
    const safeRest = Number(creditsRest) || 0
    if (!safeTotal) return 0
    // 计算剩余额度百分比：剩余额度 / 总额度 * 100
    // 保留两位小数以提高精度
    const percent = (safeRest / safeTotal) * 100
    return Math.max(0, Math.min(Math.round(percent * 100) / 100, 100))
  }

  useEffect(() => {
    const usagePercent = getUsagePercent(userSelectedTokenPlan)
    setPercent(usagePercent)
  }, [userSelectedTokenPlan])

  return (
    <Container>
      <div className="item">
        <span className="label">{t('settings.provider.api_key.token_plan.cur_plan.name')}</span>
        <span className="name">{userSelectedTokenPlan?.planName}</span>
        <span className="classify-tag">{userSelectedTokenPlan?.classifyName}</span>
      </div>
      <div className="item">
        <span className="label">{t('settings.provider.api_key.token_plan.columns.creditsRest')}：</span>
        <div style={{ width: '160px' }}>
          <Progress percent={percent} status="normal" size="small" />
        </div>
      </div>
      {/*<div className="item">
        <span className="label">
          {t('settings.provider.api_key.token_plan.columns.effective')}：
        </span>
        <div className="effective">
          <div className="date-row num">
            <span className="date-tag start">
              {t('settings.provider.api_key.token_plan.effective_s')}
            </span>
            {userSelectedTokenPlan?.paymentStatus == '2' ? userSelectedTokenPlan?.effectiveStartTime || '--' : '--'}
          </div>
          <div className="date-row num">
            <span className="date-tag end">
              {t('settings.provider.api_key.token_plan.effective_e')}
            </span>
            {userSelectedTokenPlan?.paymentStatus === '2' ? userSelectedTokenPlan?.effectiveEndTime || '--' : '--'}
          </div>
        </div>
      </div>*/}
    </Container>
  )
}

export default TokenPlanInfo

const Container = styled.div`
  display: flex;
  gap: 25px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);

  > .item {
    display: flex;
    align-items: center;
    >.label{
      font-size: 13px;
      color: var(--color-text-2);
    }
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .classify-tag {
    display: inline-block;
    width: fit-content;
    padding: 0 4px;
    background-color: var(--color-list-item);
    color: var(--color-primary);
    border-radius: var(--base-border-radius);
    font-size: 12px;
    margin-left: 5px;
  }

  .effective {
    font-size: 12px;
    color: var(--color-text-2);
  }
`
