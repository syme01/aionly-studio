import { useAppSelector } from '@renderer/store'
import { selectToken } from '@renderer/store/user'
import { useCallback, useEffect, useState } from 'react'

export function useLoginState() {
  const token = useAppSelector(selectToken)
  const [isLogin, setIsLogin] = useState(() => !!token)

  useEffect(() => {
    setIsLogin(!!token)
  }, [token])

  const completeLogin = useCallback(() => setIsLogin(true), [])

  return { isLogin, completeLogin }
}
