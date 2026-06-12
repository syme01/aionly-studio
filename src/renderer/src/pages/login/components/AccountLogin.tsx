import { loggerService } from '@logger'
import { captchaEnabledApi, loginApi } from '@renderer/api/login'
import i18n from '@renderer/i18n'
import { Form, type FormProps, Input } from 'antd'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

interface AccountLoginProps {
  ref?: React.Ref<AccountLoginRef>
  onSubmit?: () => void
  onFormChange?: (valid: boolean) => void
  verifyRef?: any
}

export interface AccountLoginRef {
  sendCode?: (verifyParams: any) => void
  login?: () => Promise<void>
  triggerVerify?: () => void
}

const Container = styled.div`
  background: #fff;
  padding-top: 12px;
`

const StyleInput = styled(Input)`
  height: 46px;
`

const logger = loggerService.withContext('AccountLogin')

export const AccountLogin = ({ ref, ...props }: AccountLoginProps) => {
  type FieldType = {
    username?: string
    password?: string
  }

  // 手机号正则
  const phoneRegexp =
    /^(((13[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[3-8]{1})|(18[0-9]{1})|(19[0-9]{1})|(14[5-7]{1}))+\d{8})$/
  // 邮箱正则
  const emailRegexp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  // 合并正则
  const userNamePattern = phoneRegexp || emailRegexp
  // 密码正则
  const passwordPattern = /^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$)([^\u4e00-\u9fa5\s]){6,20}$/

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form] = Form.useForm<FieldType>()

  const [accountForm, setAccountForm] = useState({
    tenantId: '000001',
    username: '',
    password: '',
    userType: 'web_user',
    clientId: import.meta.env.VITE_APP_CLIENT_ID,
    grantType: 'password',
    smsCode: '',
    code: '',
    inviteAccountId: undefined,
    inviteCode: undefined,
    inviteSuffix: undefined,
    loginUrl: window.location.href
  })

  // 登录接口
  const login = async () => {
    // 先做表单验证
    await form.validateFields()

    const { data } = await loginApi(accountForm)
    if (data && data.access_token) {
      localStorage.setItem('token', data.access_token)
      props.onSubmit?.()
    }
  }

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    logger.debug('登录表单提交成功', values)
    login()
  }

  const onValuesChange = (_changedValues: any, allValues: any) => {
    const valid = !!allValues.username && !!allValues.password
    props.onFormChange?.(valid)
    setAccountForm((prev) => {
      return {
        ...prev,
        username: allValues.username,
        password: allValues.password
      }
    })
  }

  const handleSendCode = async () => {
    const username = form.getFieldValue('username')

    if (!username) {
      return
    }

    captchaEnabledApi()
    props.verifyRef.current?.show()
  }

  // 触发滑块验证码（供父组件调用）
  const triggerVerify = () => {
    handleSendCode()
  }

  // 发送验证码---真正走接口的地方
  const sendCode = (verifyParams: any) => {
    handleTokenApi(verifyParams)
  }

  // 校验邮箱接口
  async function handleTokenApi(verifyParams: any) {
    setAccountForm((prev) => {
      return {
        ...prev,
        code: verifyParams.captchaVerification
      }
    })
  }

  // 暴露给父组件
  useImperativeHandle(ref, () => ({
    sendCode,
    login,
    triggerVerify
  }))

  useEffect(() => {
    const timer = timerRef.current
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // 获取动态路由参数中的邀请码
    const inviteCode: any = sessionStorage.getItem('inviteCode')
    const inviteLinkCode: any = sessionStorage.getItem('inviteLinkCode')
    const suffix: any = sessionStorage.getItem('suffix')

    if (inviteCode) {
      setAccountForm((prev) => ({
        ...prev,
        inviteAccountId: inviteCode,
        inviteCode: undefined,
        inviteSuffix: undefined
      }))
      sessionStorage.removeItem('inviteCode')
    } else if (inviteLinkCode && suffix) {
      setAccountForm((a) => ({
        ...a,
        inviteAccountId: undefined,
        inviteCode: inviteLinkCode,
        inviteSuffix: suffix
      }))
    } else {
      setAccountForm((a) => ({
        ...a,
        inviteAccountId: undefined,
        inviteCode: undefined,
        inviteSuffix: undefined
      }))
    }
  }, [])

  return (
    <Container>
      <Form form={form} size="large" onFinish={onFinish} onValuesChange={onValuesChange} autoComplete="off">
        <Form.Item<FieldType>
          name="username"
          rules={[
            {
              required: true,
              message: i18n.t('login.account_login.username_required')
            },
            {
              pattern: userNamePattern,
              message: i18n.t('login.account_login.username_invalid')
            }
          ]}>
          <StyleInput placeholder={i18n.t('login.account_login.username_required')} />
        </Form.Item>

        <Form.Item<FieldType>
          name="password"
          rules={[
            {
              required: true,
              message: i18n.t('login.account_login.password_required')
            },
            {
              pattern: passwordPattern,
              message: i18n.t('login.account_login.password_invalid')
            }
          ]}>
          <StyleInput placeholder={i18n.t('login.account_login.password_required')} />
        </Form.Item>
      </Form>
    </Container>
  )
}
