import http from '@renderer/utils/request'

//初始化客户端
export const initClientApi = () => {
  return http.get(`/seat/client/initClient`, {}, { cancel: false, loading: false })
}

//获取空闲坐席
export const getFreeSeatUserApi = () => {
  return http.get(`/seat/client/getFreeSeatUser`, {}, { cancel: false, loading: false })
}

//获取所有聊天记录
export const getMyMessageListApi = (params) => {
  return http.get(`/seat/client/getMyMessageList`, params, { cancel: false, loading: false })
}

//获取本次聊天记录
export const getChatMessageListApi = (chatId) => {
  return http.get(`/seat/client/getChatMessageList`, { chatId: chatId }, { cancel: false, loading: false })
}

//创建会话
export const createChatApi = (params) => {
  return http.post(`/seat/client/createChat`, params, { cancel: false, loading: false })
}

//结束会话
export const overChatApi = (params) => {
  return http.put(`/seat/seat/overChat`, params, { cancel: false, loading: false })
}

//获取详情
export const getChatInfoApi = (chatId) => {
  return http.get(`/seat/client/getChatInfo`, { chatId: chatId }, { cancel: false, loading: false })
}

//获取售前信息
export const getServiceApi = (domainName) => {
  return http.get(`/base/agentSet/getAgentOrService?domainName=${domainName}`, {}, { cancel: false, loading: false })
}

//获取售前信息
export const getServiceForPcNew = () => {
  return http.get(`/base/onlineService/getServiceForPcNew`, {}, { cancel: false, loading: false })
}
