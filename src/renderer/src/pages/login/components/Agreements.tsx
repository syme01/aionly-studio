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
`

export const Agreements = (props: AgreementsProps) => {
  const onChange: CheckboxProps['onChange'] = (e) => {
    console.log('checked', e.target.checked)
    props.onChange?.(e.target.checked)
  }

  return (
    <div className="flex justify-center">
      <ACheckbox onChange={onChange}>{i18n.t('onboarding.agreements.accept')}</ACheckbox>
      <LinkButton type="link" size="small">
        {i18n.t('onboarding.agreements.user')}{' '}
      </LinkButton>
      <SpanText>、</SpanText>
      <LinkButton type="link" size="small">
        {i18n.t('onboarding.agreements.privacy')}{' '}
      </LinkButton>
      <SpanText>{i18n.t('onboarding.agreements.yu')}</SpanText>
      <LinkButton type="link" size="small">
        {i18n.t('onboarding.agreements.disclaimer')}
      </LinkButton>
    </div>
  )
}
