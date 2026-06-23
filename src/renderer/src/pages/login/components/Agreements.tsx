import { loggerService } from '@logger'
import i18n from '@renderer/i18n'
import type { CheckboxProps } from 'antd'
import { Button, Checkbox } from 'antd'
import styled from 'styled-components'

interface AgreementsProps {
  onChange?: (checked: boolean) => void
  checked?: boolean
}

const ACheckbox = styled(Checkbox)`
  .ant-checkbox-label{
    padding-right: 0;
    font-size: 13px;
  }
`
const LinkButton = styled(Button)`
  padding: 0;
  font-size: 13px;
`

const SpanText = styled.span`
  font-size: 13px;
  padding-top: 1px;
`

const logger = loggerService.withContext('Agreements')

export const Agreements = (props: AgreementsProps) => {
  const onChange: CheckboxProps['onChange'] = (e) => {
    logger.debug('协议勾选状态变更', { checked: e.target.checked })
    props.onChange?.(e.target.checked)
  }

  return (
    <div className="flex justify-center">
      <ACheckbox onChange={onChange}>{i18n.t('login.agreements.agree')}</ACheckbox>
      <LinkButton type="link" size="small">
        {i18n.t('login.agreements.user')}{' '}
      </LinkButton>
      <SpanText>、</SpanText>
      <LinkButton type="link" size="small">
        {i18n.t('login.agreements.privacy')}{' '}
      </LinkButton>
      <SpanText>{i18n.t('login.agreements.yu')}</SpanText>
      <LinkButton type="link" size="small">
        {i18n.t('login.agreements.disclaimer')}
      </LinkButton>
    </div>
  )
}
