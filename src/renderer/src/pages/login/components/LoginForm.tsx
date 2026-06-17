import bgLoginF from '@renderer/assets/images/login/bg-login-f.jpg'
import lwImg from '@renderer/assets/images/login/lw.png'
import Verify from '@renderer/components/verifition/Verify'
import i18n from '@renderer/i18n'
import { Agreements } from '@renderer/pages/login/components/Agreements'
import type { TabsProps } from 'antd'
import { Button } from 'antd'
import { Tabs } from 'antd'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { AccountLogin, type AccountLoginRef } from './AccountLogin'
import { EmailLogin, type EmailLoginRef } from './EmailLogin'
import { SMSLogin, type SMSLoginRef } from './SMSLogin'

const Container = styled.div`
  width: 100%;
  display: flex;
  height: 100%;
  .ant-form-item-with-help .ant-form-item-explain{
    font-size: 12px;
  }
`

const LeftPanel = styled.div`
  width: 40%;
  background: url(${bgLoginF}) center center / 100% 100% no-repeat;
  position: relative;
`

const RightPanel = styled.div`
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);

  .inner{
    width: 432px;
  }

  .ant-tabs-nav {
    &::before {
      display: none;
    }

    .ant-tabs-tab {
      padding: 0 0 10px;
    }
  }
`

const LogoImage = styled.img`
  max-width: 200px;
  margin-left: 64px;
  margin-top: 36px;
`

const NewUserGiftWrap = styled.div`
  width: 88%;
  height: 56px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  // border: 1px solid #ddd;
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-family: Source Han Sans CN;
  color: #ff6600;
  font-size: 18px;
`

const LoginTitle = styled.div`
  font-family: Alimama ShuHeiTi;
  font-weight: 700;
  color: #060a26;
  font-size: 30px;
  margin: 0 auto 30px;
  text-align: center;
`

const BottomPanel = styled.div`
  width: 432px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  font-size: 13px;

  button {
    padding: 0;
    font-size: 13px;
  }

  span{
    padding-top: 2px;
  }
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
  onComplete?: () => void
}

export const LoginForm = (props: LoginFormProps) => {
  const [activeTabKey, setActiveTabKey] = useState('1')
  const [isAccept, setIsAccept] = useState(false)
  const [formValid, setFormValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  const verifyRef = useRef<any>(null)
  const smsLoginRef = useRef<SMSLoginRef | null>(null)
  const emailLoginRef = useRef<EmailLoginRef | null>(null)
  const accountLoginRef = useRef<AccountLoginRef | null>(null)

  useEffect(() => {
    const agentInfoStr = localStorage.getItem('agentInfo')
    if (agentInfoStr) {
      const agentInfo = JSON.parse(agentInfoStr)
      setLogoUrl(agentInfo.logoUrl)
    }
  }, [])

  // 获取当前激活 tab 对应的子组件 ref
  const getActiveRef = () => {
    const map = {
      '1': smsLoginRef,
      '2': emailLoginRef,
      '3': accountLoginRef
    }
    return map[activeTabKey]
  }

  const onAcceptChange = (checked: boolean) => {
    setIsAccept(checked)
  }

  const onFormChange = (valid: boolean) => {
    setFormValid(valid)
  }

  const tabList: TabsProps['items'] = [
    {
      key: '1',
      label: '短信登录',
      children: (
        <SMSLogin ref={smsLoginRef} verifyRef={verifyRef} onFormChange={onFormChange} onSubmit={props.onComplete} />
      )
    },
    {
      key: '2',
      label: '邮箱登录',
      children: (
        <EmailLogin ref={emailLoginRef} verifyRef={verifyRef} onFormChange={onFormChange} onSubmit={props.onComplete} />
      )
    },
    {
      key: '3',
      label: '账号登录',
      children: (
        <AccountLogin
          ref={accountLoginRef}
          verifyRef={verifyRef}
          onFormChange={onFormChange}
          onSubmit={props.onComplete}
        />
      )
    }
  ]

  const onTabChange = (key: string) => {
    setActiveTabKey(key)
    // 切换 tab 时重置表单有效状态
    setFormValid(false)
  }

  // 滑块验证码成功回调——路由到当前激活的子组件
  const verifyOnSuccess = async (params: any) => {
    const activeRef = getActiveRef()
    activeRef?.current?.sendCode?.(params)
    verifyRef.current?.closeBox()
  }

  // 登录按钮点击——调用当前激活子组件的 login 方法
  const handleLoginSubmit = async () => {
    if (!isAccept) return
    const activeRef = getActiveRef()
    if (!activeRef?.current?.login) return
    setLoading(true)
    try {
      await activeRef.current.login()
    } finally {
      setLoading(false)
    }
  }

  const disabledLogin = !isAccept || !formValid

  return (
    <>
      <Container>
        <LeftPanel>
          <LogoImage src={logoUrl} alt="logo" />
          <NewUserGiftWrap>
            <img className="w-8" src={lwImg} alt="lw" />
            {i18n.t('login.newUserGift')}
          </NewUserGiftWrap>
        </LeftPanel>
        <RightPanel>
          <div className="inner">
            <LoginTitle>{i18n.t('login.title')}</LoginTitle>
            <Tabs
              centered
              style={{ width: '432px' }}
              tabBarGutter={48}
              size="large"
              activeKey={activeTabKey}
              defaultActiveKey="1"
              items={tabList}
              onChange={onTabChange}
            />

            <Agreements onChange={onAcceptChange} checked={isAccept} />

            <LoginButton
              type="primary"
              block={true}
              disabled={disabledLogin}
              loading={loading}
              onClick={handleLoginSubmit}
              style={{ marginTop: 12 }}>
              {i18n.t('login.login_register')}
            </LoginButton>

            <BottomPanel>
              <Button type="link">{i18n.t('login.sub_account')}</Button>
              <Button type="link">{i18n.t('login.forget_password')}</Button>
            </BottomPanel>
          </div>
        </RightPanel>
      </Container>

      <Verify
        ref={verifyRef}
        captchaType={'blockPuzzle'}
        mode={'pop'}
        imgSize={{ width: '400px', height: '200px' }}
        onSuccess={verifyOnSuccess}
      />
    </>
  )
}
