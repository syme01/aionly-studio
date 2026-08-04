import http from '@renderer/utils/request'

// 获取小程序列表
export const getMiniProgramList = (params: any) => {
  return http.get(`/base/miniProgram/list`, params, { cancel: false })
}
