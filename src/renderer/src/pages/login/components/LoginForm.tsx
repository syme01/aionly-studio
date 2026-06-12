import bgLoginF from '@renderer/assets/images/login/bg-login-f.jpg'
import lwImg from '@renderer/assets/images/login/lw.png'
import Verify from '@renderer/components/verifition/Verify'
import i18n from '@renderer/i18n'
import { Button, TabsProps } from 'antd'
import { Tabs } from 'antd'
import { useRef, useState } from 'react'
import styled from 'styled-components'

import { AccountLogin } from './AccountLogin'
import { EmailLogin } from './EmailLogin'
import { SMSLogin } from './SMSLogin'

const Container = styled.div`
  width: 100%;
  display: flex;
  height: 100%;
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
  margin-bottom: 30px;
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

interface LoginFormProps {
  onComplete?: () => void
}

export const LoginForm = (props: LoginFormProps) => {
  const [isAccept, setIsAccept] = useState(false)
  const verifyRef = useRef<any>(null)
  const smsLoginRef = useRef<any>(null)

  const onAcceptChange = (checked: boolean) => {
    setIsAccept(checked)
  }

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '短信登录',
      children: (
        <SMSLogin
          ref={smsLoginRef}
          isAccept={isAccept}
          verifyRef={verifyRef}
          onChange={onAcceptChange}
          onSubmit={props.onComplete}
        />
      )
    },
    {
      key: '2',
      label: '邮箱登录',
      children: <EmailLogin isAccept={isAccept} />
    },
    {
      key: '3',
      label: '账号登录',
      children: <AccountLogin isAccept={isAccept} />
    }
  ]

  const onTabChange = (key: string) => {
    console.log(key)
  }

  // 滑块验证码成功回调
  const verifyOnSuccess = async (params: any) => {
    console.log('verifyOnSuccess', params)
    smsLoginRef.current?.sendCode(params)
    verifyRef.current?.closeBox()
  }

  return (
    <>
      <Container>
        <LeftPanel>
          <LogoImage
            src="https://hf.rhwx-ai.com:9824/maas/2026/06/01/dfa6513b6b164feaa766fa9e13f64b32.png"
            alt="logo"
          />
          <NewUserGiftWrap>
            <img className="w-8" src={lwImg} alt="lw" />
            {i18n.t('onboarding.newUserGift')}
          </NewUserGiftWrap>
        </LeftPanel>
        <RightPanel>
          <LoginTitle>{i18n.t('onboarding.welcome.title')}</LoginTitle>
          <Tabs
            centered
            style={{ width: '432px' }}
            tabBarGutter={48}
            size="large"
            defaultActiveKey="1"
            items={items}
            onChange={onTabChange}
          />
          <BottomPanel>
            <Button type="link">{i18n.t('onboarding.sub_account')}</Button>
            <Button type="link">{i18n.t('onboarding.forget_password')}</Button>
          </BottomPanel>
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
