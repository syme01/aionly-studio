import { loginApi } from '@renderer/api/login'

enum LoginType {
  phone = 'Phone',
  Email = 'Email',
  Account = 'Account'
}

interface LoginOptions {
  loginType: LoginType
  params: object
  callback: (token: string) => void
}

// 登录钩子
export const useLogin = (options: LoginOptions) => {
  const login = async () => {
    const { data } = await loginApi(options.params)
    localStorage.setItem('token', data.access_token)
  }
}
