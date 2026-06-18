import { useLoginState } from '@renderer/hooks/useLoginState'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

const AuthRoute = ({ children }: { children: ReactNode }) => {
  const { isLogin } = useLoginState()

  if (!isLogin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default AuthRoute
