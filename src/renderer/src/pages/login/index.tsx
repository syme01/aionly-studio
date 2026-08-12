import WindowControls from '@renderer/components/WindowControls'
import { useTheme } from '@renderer/context/ThemeProvider'
import { getThemeModeLabel } from '@renderer/i18n/label'
import { ThemeMode } from '@types'
import { Tooltip } from 'antd'
import { Monitor } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import ForgotPassword from './components/forgotPassword/index'
import Layout from './components/Layout'
import { LoginForm } from './components/LoginForm'
import { SubAccountLogin } from './components/subAccount/SubAccountLogin'
import { LoginProvider, LoginSceneType } from './contexts/LoginContext'

interface LoginPageProps {
  onComplete?: () => void
}

interface SceneMap {
  [key: string]: React.ReactNode
}

const LoginPage = (props: LoginPageProps) => {
  const [scene, setScene] = useState<LoginSceneType>(LoginSceneType.MainAccount)
  const { t } = useTranslation()
  const { theme, settedTheme, toggleTheme } = useTheme()

  // 根据 scene 渲染不同的登录组件
  const renderLoginComponent = () => {
    const scene_map: SceneMap = {
      [LoginSceneType.MainAccount]: <LoginForm onComplete={props.onComplete} />,
      [LoginSceneType.SubAccount]: <SubAccountLogin onComplete={props.onComplete} />,
      [LoginSceneType.ForgotPassword]: <ForgotPassword />,
      [LoginSceneType.Register]: <div>注册组件（待实现）</div>
    }

    if (scene_map[scene]) {
      return scene_map[scene]
    }

    return <LoginForm onComplete={props.onComplete} />
  }

  return (
    <LoginProvider value={{ scene, setScene }}>
      <div className="flex h-screen w-screen flex-col">
        <div className="drag flex w-full shrink-0 items-center justify-end" style={{ height: 'var(--navbar-height)' }}>
          <Tooltip title={t('settings.theme.title') + ': ' + getThemeModeLabel(settedTheme)} placement="bottom">
            <Icon theme={theme} onClick={toggleTheme}>
              {settedTheme === ThemeMode.dark ? (
                /*<Moon size={20} className="icon" />*/
                <i className="icon iconfont icon-yueliang"></i>
              ) : settedTheme === ThemeMode.light ? (
                /* <Sun size={20} className="icon" />*/
                <i className="icon iconfont icon-ai250"></i>
              ) : (
                <Monitor size={20} className="icon" />
              )}
            </Icon>
          </Tooltip>
          <WindowControls />
        </div>
        <div className="flex flex-1 px-2 pb-2">
          <div className="relative flex flex-1 overflow-hidden rounded-xl bg-(--color-background)">
            <Layout>{renderLoginComponent()}</Layout>
          </div>
        </div>
      </div>
    </LoginProvider>
  )
}

export default LoginPage

const Icon = styled.div<{ theme: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  box-sizing: border-box;
  -webkit-app-region: none;
  border: 0.5px solid transparent;
  .icon {
    color: var(--color-icon);
    &.icon-ai250{
      font-size: 18px;
    }
  }
  &:hover {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    opacity: 0.8;
    cursor: pointer;
    .icon {
      color: var(--color-icon-white);
    }
  }
  &.active {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    border: 0.5px solid var(--color-border);
    .icon {
      color: var(--color-primary);
    }
  }

  @keyframes borderBreath {
    0% {
      opacity: 0.1;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.1;
    }
  }
`
