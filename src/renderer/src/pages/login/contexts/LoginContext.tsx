import { createContext, type ReactNode, use } from 'react'

export enum LoginSceneType {
  MainAccount = 'main-account',
  SubAccount = 'sub-account',
  ForgotPassword = 'forgot-password',
  Register = 'register'
}

interface LoginContextType {
  scene: LoginSceneType
  setScene: (scene: LoginSceneType) => void
}

const LoginContext = createContext<LoginContextType | undefined>(undefined)

export const useLoginContext = () => {
  const context = use(LoginContext)
  if (!context) {
    throw new Error('useLoginContext must be used within LoginProvider')
  }
  return context
}

interface LoginProviderProps {
  children: ReactNode
  value: LoginContextType
}

export const LoginProvider = ({ children, value }: LoginProviderProps) => {
  return <LoginContext value={value}>{children}</LoginContext>
}
