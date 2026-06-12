import http from '@renderer/utils/request'

export function reqGet(params: any) {
  return http.post(`/auth/captcha/get`, params, { cancel: false, loading: false })
}

export function reqCheck(params: any) {
  return http.post(`/auth/captcha/check`, params, { cancel: false, loading: false })
}
