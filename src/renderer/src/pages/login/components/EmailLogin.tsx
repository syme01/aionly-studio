import { captchaEnabledApi, emailCaptchaApi, loginApi } from '@renderer/api/login'
import i18n from '@renderer/i18n'
import { Button, Form, type FormProps, Input, message } from 'antd'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Agreements } from './Agreements'

interface EmailLoginProps {
  isAccept: boolean
  onChange?: (isAccept: boolean) => void
  onSubmit?: () => void
  verifyRef?: any
}

export interface EmailLoginRef {
  sendCode?: (verifyParams: any) => void
}

const Container = styled.div`
  background: #fff;
  padding-top: 12px;
`

const StyleInput = styled(Input)`
    height: 46px;
`

const LoginButton = styled(Button)`
  width: 100%;
  height: 46px;
  background: rgba(6, 10, 38, 1);
  border-radius: 8px;

  &:not(:disabled):hover {
    background: rgba(6, 10, 38, 0.8) !important;
  }
`

export const EmailLogin = ({ ref, ...props }: EmailLoginProps & { ref?: React.RefObject<EmailLoginRef | null> }) => {
  type FieldType = {
    email?: string
    emailCode?: string
    accept?: boolean
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FieldType>()

  const [emailForm, setEmailForm] = useState({
    tenantId: '000001',
    email: '',
    clientId: import.meta.env.VITE_APP_CLIENT_ID,
    userType: 'web_user',
    grantType: 'email',
    emailCode: '',
    code: '',
    inviteAccountId: undefined,
    inviteCode: undefined,
    inviteSuffix: undefined,
    loginUrl: window.location.href
  })

  // 登录接口
  const login = async () => {
    try {
      setLoading(true)
      const { data } = await loginApi(emailForm)
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token)
        props.onSubmit?.()
      }
    } finally {
      setLoading(false)
    }
  }

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values)
    login()
  }

  const onValuesChange = (changedValues: any, allValues: any) => {
    console.log('allValues', changedValues, allValues)
    const disabled = !allValues.email || !allValues.emailCode || !allValues.accept
    setDisabledLogin(disabled)
    setEmailForm({
      ...emailForm,
      email: allValues.email,
      emailCode: allValues.emailCode
    })
  }

  const [disabled, setDisabled] = useState(true)
  const [disabledLogin, setDisabledLogin] = useState(true)
  const [codeBtnText, setCodeBtnText] = useState(i18n.t('onboarding.email_login.send_code'))

  const handleChangeEmail = (e: any) => {
    const disabled = !e.target.value
    setDisabled(disabled)
  }

  const disCount = (time: number) => {
    timerRef.current = setTimeout(() => {
      const next = time - 1
      if (next <= 0) {
        timerRef.current = null
        setDisabled(false)
        setCodeBtnText(i18n.t('onboarding.email_login.send_code'))
      } else {
        setCodeBtnText(i18n.t('onboarding.email_login.send_code') + '(' + next + ')')
        disCount(next)
      }
    }, 1000)
  }

  const handleSendCode = async () => {
    const email = form.getFieldValue('email')
    const regexp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!email) {
      return
    }

    if (!regexp.test(email)) {
      message.error(i18n.t('onboarding.email_login.email_invalid'))
      return
    }

    captchaEnabledApi()
    props.verifyRef.current?.show()
  }

  // 发送验证码---真正走接口的地方
  const sendCode = (verifyParams: any) => {
    setDisabled(true)
    setCodeBtnText(i18n.t('onboarding.email_login.send_code') + '(60)')
    disCount(60)
    handleEmailCaptchaAndTokenApi(verifyParams)
  }

  // 校验邮箱接口
  async function handleEmailCaptchaAndTokenApi(verifyParams: any) {
    setEmailForm({
      ...emailForm,
      code: verifyParams.captchaVerification
    })
    try {
      await emailCaptchaApi({
        emailForm: emailForm.email,
        loginUrl: window.location.href
      })
    } catch (e: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setDisabled(false)
      setCodeBtnText(i18n.t('onboarding.email_login.send_code'))
      throw new Error(e)
    }
  }

  // 暴露给父组件
  useImperativeHandle(ref, () => ({
    sendCode
  }))

  const suffix = (
    <Button type="link" size="small" disabled={disabled} onClick={handleSendCode}>
      {codeBtnText}
    </Button>
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    // 获取动态路由参数中的邀请码
    const inviteCode: any = sessionStorage.getItem('inviteCode')
    const inviteLinkCode: any = sessionStorage.getItem('inviteLinkCode')
    const suffix: any = sessionStorage.getItem('suffix')

    if (inviteCode) {
      setEmailForm({
        ...emailForm,
        inviteAccountId: inviteCode,
        inviteCode: undefined,
        inviteSuffix: undefined
      })
      sessionStorage.removeItem('inviteCode')
    } else if (inviteLinkCode && suffix) {
      setEmailForm({
        ...emailForm,
        inviteAccountId: undefined,
        inviteCode: inviteLinkCode,
        inviteSuffix: suffix
      })
    } else {
      setEmailForm({
        ...emailForm,
        inviteAccountId: undefined,
        inviteCode: undefined,
        inviteSuffix: undefined
      })
    }
  }, [])

  return (
    <Container>
      <Form
        form={form}
        name="basic"
        size="large"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        autoComplete="off">
        <Form.Item<FieldType>
          name="email"
          rules={[{ required: true, message: i18n.t('onboarding.email_login.email_required') }]}>
          <StyleInput onChange={handleChangeEmail} placeholder={i18n.t('onboarding.email_login.email_required')} />
        </Form.Item>

        <Form.Item<FieldType>
          name="emailCode"
          rules={[{ required: true, message: i18n.t('onboarding.email_login.code_required') }]}>
          <StyleInput suffix={suffix} placeholder={i18n.t('onboarding.email_login.code_required')} />
        </Form.Item>

        <Form.Item<FieldType> name="accept" style={{ marginBottom: '5px', marginTop: '0' }}>
          <Agreements onChange={props.onChange} />
        </Form.Item>

        <Form.Item label={null} style={{ marginBottom: 0 }}>
          <LoginButton type="primary" block={true} disabled={disabledLogin} loading={loading} htmlType="submit">
            {i18n.t('onboarding.login_register')}
          </LoginButton>
        </Form.Item>
      </Form>
    </Container>
  )
}
