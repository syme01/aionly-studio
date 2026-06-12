import { captchaEnabledApi, loginApi, smsCaptchaAndTokenApi } from '@renderer/api/login'
import i18n from '@renderer/i18n'
import type { FormProps } from 'antd'
import { Button, Form, Input, message, Space } from 'antd'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Agreements } from './Agreements'

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

interface LoginFormProps {
  isAccept: boolean
  onChange?: (isAccept: boolean) => void
  onSubmit?: () => void
  verifyRef?: any
}

export interface SMSLoginRef {
  sendCode?: (verifyParams: any) => void
}

export const SMSLogin = ({ ref, ...props }: LoginFormProps & { ref?: React.RefObject<SMSLoginRef | null> }) => {
  type FieldType = {
    phonenumber?: string
    smsCode?: string
    accept?: boolean
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FieldType>()

  const [codeForm, setCodeForm] = useState({
    tenantId: '000001',
    phonenumber: '',
    clientId: import.meta.env.VITE_APP_CLIENT_ID,
    userType: 'web_user',
    grantType: 'sms',
    smsCode: '',
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
      const { data } = await loginApi(codeForm)
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
    const disabled = !allValues.phonenumber || !allValues.smsCode || !allValues.accept
    setDisabledLogin(disabled)
    setCodeForm({
      ...codeForm,
      phonenumber: allValues.phonenumber,
      smsCode: allValues.smsCode
    })
  }

  const [disabled, setDisabled] = useState(true)
  const [disabledLogin, setDisabledLogin] = useState(true)
  const [codeBtnText, setCodeBtnText] = useState(i18n.t('onboarding.sms_login.send_code'))

  const handleChangePhone = (e: any) => {
    const disabled = !e.target.value
    setDisabled(disabled)
  }

  const disCount = (time: number) => {
    timerRef.current = setTimeout(() => {
      const next = time - 1
      if (next <= 0) {
        timerRef.current = null
        setDisabled(false)
        setCodeBtnText(i18n.t('onboarding.sms_login.send_code'))
      } else {
        setCodeBtnText(i18n.t('onboarding.sms_login.send_code') + '(' + next + ')')
        disCount(next)
      }
    }, 1000)
  }

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phonenumber')
    const regexp =
      /^(((13[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[3-8]{1})|(18[0-9]{1})|(19[0-9]{1})|(14[5-7]{1}))+\d{8})$/

    if (!phone) {
      return
    }

    if (!regexp.test(phone)) {
      message.error(i18n.t('onboarding.sms_login.phone_invalid'))
      return
    }

    captchaEnabledApi()
    props.verifyRef.current?.show()
  }

  // 发送验证码---真正走接口的地方
  const sendCode = (verifyParams: any) => {
    setDisabled(true)
    setCodeBtnText(i18n.t('onboarding.sms_login.send_code') + '(60)')
    disCount(60)
    handleSmsCaptchaAndTokenApi(verifyParams)
  }

  // 校验手机验证码
  async function handleSmsCaptchaAndTokenApi(verifyParams: any) {
    // 更新验证码参数
    setCodeForm({
      ...codeForm,
      code: verifyParams.captchaVerification
    })
    try {
      //添加滑块验证token
      const tokenValidate = localStorage.getItem('tokenValidate')
      //若为邀请账号，则后台验证是否输入的为邀请人账号
      const inviteAccountId = codeForm.inviteAccountId
      await smsCaptchaAndTokenApi({
        phonenumber: codeForm.phonenumber,
        tokenValidate,
        inviteAccountId,
        loginUrl: window.location.href
      })
    } catch (e: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setDisabled(false)
      setCodeBtnText(i18n.t('onboarding.sms_login.send_code'))
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
      setCodeForm({
        ...codeForm,
        inviteAccountId: inviteCode,
        inviteCode: undefined,
        inviteSuffix: undefined
      })
      sessionStorage.removeItem('inviteCode')
    } else if (inviteLinkCode && suffix) {
      setCodeForm({
        ...codeForm,
        inviteAccountId: undefined,
        inviteCode: inviteLinkCode,
        inviteSuffix: suffix
      })
    } else {
      setCodeForm({
        ...codeForm,
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
          name="phonenumber"
          rules={[{ required: true, message: i18n.t('onboarding.sms_login.phone_required') }]}>
          <Space.Compact style={{ width: '100%' }}>
            <StyleInput style={{ width: '20%' }} value={'+86'} readOnly={true} />
            <StyleInput
              style={{ width: '80%' }}
              onChange={handleChangePhone}
              placeholder={i18n.t('onboarding.sms_login.phone_required')}
            />
          </Space.Compact>
        </Form.Item>

        <Form.Item<FieldType>
          name="smsCode"
          rules={[{ required: true, message: i18n.t('onboarding.sms_login.code_required') }]}>
          <StyleInput suffix={suffix} placeholder={i18n.t('onboarding.sms_login.code_required')} />
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
