import http from '@renderer/utils/request'

//获取所有文档内容列表
export const getOrderList = (params) => {
  return http.get(`/bus/order/getOrderList`, params, { cancel: false })
}
export const getproductlist = (params) => {
  return http.get(`/bus/product/getproductlist`, params, { cancel: false })
}

export const addIndent = (params) => {
  return http.post(`/bus/indent/addIndent`, params, { cancel: false })
}

export const deleteIndentById = (params) => {
  return http.get(`/bus/indent/deleteIndentById`, params, { cancel: false })
}
export const updateIndent = (params) => {
  return http.post(`/bus/indent/updateIndent`, params, { cancel: false })
}

export const getIndentList = (params) => {
  return http.get(`/bus/indent/getIndentList`, params, { cancel: false })
}

export const getIndentWebList = (params) => {
  return http.get(`/bus/indent/getIndentWebList`, params, { cancel: false })
}
export const getIndentCountList = (params = {}) => {
  return http.get(`/bus/indent/getIndentCountList`, params, { cancel: false })
}

export const getReplyList = (params) => {
  return http.get(`/bus/reply/getReplyList`, params, { cancel: false })
}

export const addReply = (params) => {
  return http.post(`/bus/reply/addReply`, params, { cancel: false })
}

export const uploadApi = (params) => {
  return http.post(`/resource/oss/upload`, params, { cancel: false })
}

export const deleteFileWeb = (params) => {
  return http.get(`/resource/oss/delete`, params, { cancel: false })
}

export const remoteFile = (params) => {
  return http.get(`/bus/indent/remoteFile`, params, { cancel: false })
}

export const saveConfirmedOrder = (id) => {
  return http.get(`bus/indent/saveConfirmedOrder?id=${id}`, { cancel: false })
}
