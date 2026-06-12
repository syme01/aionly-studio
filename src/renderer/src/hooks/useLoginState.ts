import { useCallback, useState } from 'react'
export function useLoginState() {
  const [isLogin, setIsLogin] = useState(() => !!localStorage.getItem('token'))

  const completeLogin = useCallback(() => {
    setIsLogin(true)
  }, [])

  return {
    isLogin,
    completeLogin
  }
}
