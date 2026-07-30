import WindowControls from '@renderer/components/WindowControls'
import { useState } from 'react'

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
