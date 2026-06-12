import WindowControls from '@renderer/components/WindowControls'

import { LoginForm } from './components/LoginForm'

interface LoginPageProps {
  onComplete?: () => void
}

const LoginPage = (props: LoginPageProps) => {
  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="drag flex w-full shrink-0 items-center justify-end" style={{ height: 'var(--navbar-height)' }}>
        <WindowControls />
      </div>
      <div className="flex flex-1 px-2 pb-2">
        <div className="relative flex flex-1 overflow-hidden rounded-xl bg-(--color-background)">
          <LoginForm onComplete={props.onComplete} />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
