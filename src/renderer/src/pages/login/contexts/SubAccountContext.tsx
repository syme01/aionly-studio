import { FormInstance } from 'antd'
import { createContext, type ReactNode, use } from 'react'

import { SubAccountLoginFieldType } from '../components/subAccount/SubAccountLogin'

interface SubAccountContextType {
  parentForm?: FormInstance<SubAccountLoginFieldType>
}

const SubAccountLoginContext = createContext<SubAccountContextType | undefined>(undefined)

export const useSubAccountLoginContext = () => {
  const context = use(SubAccountLoginContext)
  if (!context) {
    throw new Error('useSubAccountLoginContext must be used within SubAccountLoginProvider')
  }
  return context
}

interface SubAccountLoginProviderProps {
  children: ReactNode
  value: SubAccountContextType
}

export const SubAccountLoginProvider = ({ children, value }: SubAccountLoginProviderProps) => {
  return <SubAccountLoginContext value={value}>{children}</SubAccountLoginContext>
}
