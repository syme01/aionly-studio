import { emailCaptchaApi, validateSmsCodeApi } from '@renderer/api/login'
import i18n from '@renderer/i18n'
import { LoginSceneType, useLoginContext } from '@renderer/pages/login/contexts/LoginContext'
import { Button, Flex, Form, type FormProps, Input, message } from 'antd'
import React, { useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

interface Props {
  changeStep?: (step: number, data?: any) => void
  verifyRef?: React.RefObject<any | null>
  ref: React.Ref<EmailFormRef>
}

export interface EmailFormRef {
  sendCode: (verifyParams: any) => Promise<void>
  handleNext: () => Promise<void>
  triggerVerify: () => Promise<void>
}

type FieldType = {
  phonenumber: string
  smsCode: string
  email: string
  emailCode: string
}

// 邮箱正则
const emailRegexp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const EmailForm: React.FC<Props> = ({ changeStep, ref, verifyRef }) => {
  const [loading, setLoading] = useState(false)
  const [disabled, setDisabled] = useState(true)
  const isDisCounting = useRef(false)
  const [form] = Form.useForm<FieldType>()
  const { setScene } = useLoginContext()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 验证码按钮文案
  const codeText = i18n.t('login.send_code')
  const [codeBtnText, setCodeBtnText] = useState(codeText)
  const verifyCode = useRef<any>('')

  const fetchSmsCodeApi = async () => {
    setLoading(true)
    try {
      const formValues = await form.validateFields()
      const { data } = await validateSmsCodeApi(formValues)
      changeStep?.(2, {
        phonenumber: '',
        smsCode: '',
        email: formValues.email,
        emailCode: formValues.emailCode,
        token: data
      })
    } finally {
      setLoading(false)
    }
  }

  const onFinish: FormProps<FieldType>['onFinish'] = async () => {
    await fetchSmsCodeApi()
  }

  const onValuesChange = () => {
    const values = form.getFieldsValue()
    const { email } = values
    const isValid = emailRegexp.test(email)
    setDisabled(!email || !isValid || isDisCounting.current)
  }

  const handleNext = async () => {
    await form.validateFields()
    await fetchSmsCodeApi()
  }

  // 倒计时
  const disCount = (time: number) => {
    isDisCounting.current = true
    timerRef.current = setTimeout(() => {
      const next = time - 1
      if (next <= 0) {
        isDisCounting.current = false
        timerRef.current = null
        setDisabled(false)
        setCodeBtnText(codeText)
      } else {
        setCodeBtnText(codeText + '(' + next + ')')
        disCount(next)
      }
    }, 1000)
  }

  // 发送验证码-触发滑块
  const triggerVerify = async () => {
    const phone = form.getFieldValue('email')

    if (!phone) {
      return
    }

    if (!emailRegexp.test(phone)) {
      message.error(i18n.t('login.forgot_password.phone.phone_invalid'))
      return
    }

    verifyRef?.current?.show()
  }

  // 邮箱校验接口
  const fetchEmailCaptchaApi = async () => {
    try {
      const email = form.getFieldValue('email')
      await emailCaptchaApi({ email })
    } catch (e: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setDisabled(false)
      setCodeBtnText(i18n.t('login.send_code'))
      throw new Error(e)
    }
  }

  /**
   * 发送验证码--触发滑块验证码（供父组件调用）
   * @param params 滑块验证码参数
   */
  const sendCode = async (params: any) => {
    verifyCode.current = params.captchaVerification
    setDisabled(true)
    setCodeBtnText(i18n.t('login.send_code') + '(60)')
    disCount(60)
    await fetchEmailCaptchaApi()
  }

  /** 暴露给父组件 **/
  useImperativeHandle(ref, () => ({
    sendCode,
    handleNext,
    triggerVerify
  }))

  const suffix = (
    <Button type="link" size="small" disabled={disabled} onClick={triggerVerify}>
      {codeBtnText}
    </Button>
  )

  return (
    <Form
      layout="vertical"
      form={form}
      size="large"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      autoComplete="off">
      <Form.Item<FieldType>
        label={i18n.t('login.forgot_password.email.email_label')}
        name="email"
        rules={[
          {
            required: true,
            message: i18n.t('login.forgot_password.email.email_required')
          },
          {
            pattern: emailRegexp,
            message: i18n.t('login.forgot_password.email.email_invalid')
          }
        ]}>
        <StyleInput onPressEnter={handleNext} placeholder={i18n.t('login.forgot_password.email.email_required')} />
      </Form.Item>

      <Form.Item<FieldType>
        label={i18n.t('login.forgot_password.email.code_label')}
        name="emailCode"
        rules={[
          {
            required: true,
            message: i18n.t('login.forgot_password.email.code_required')
          }
        ]}>
        <StyleInput
          suffix={suffix}
          onPressEnter={handleNext}
          placeholder={i18n.t('login.forgot_password.email.code_required')}
        />
      </Form.Item>

      <Form.Item style={{ marginTop: 30, marginBottom: 5 }}>
        <LoginButton type="primary" htmlType="submit" block loading={loading}>
          {i18n.t('login.forgot_password.next')}
        </LoginButton>
      </Form.Item>
      <Form.Item>
        <Flex justify="flex-end">
          <Button type="link" size="small" onClick={() => setScene(LoginSceneType.MainAccount)}>
            {i18n.t('login.back_main_login')}
          </Button>
        </Flex>
      </Form.Item>
    </Form>
  )
}

export default EmailForm

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
