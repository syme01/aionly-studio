import http from '@renderer/utils/request'

//获取计费管理列表
export const pageListApi = (params) => {
  return http.get(`/bus/userModelPackage/pagePcList`, params, { cancel: false })
}

//启用量包
export const enablePackageApi = (id) => {
  return http.post(`/bus/userModelPackage/enable/${id}`, {}, { cancel: false })
}

//启用检测
export const checkEnableApi = (id) => {
  return http.post(`/bus/userModelPackage/checkEnable/${id}`, {}, { cancel: false })
}

//停用量包
export const stopPackageApi = (id) => {
  return http.post(`/bus/userModelPackage/stop/${id}`, {}, { cancel: false })
}

//查询开通详细信息
export const getUserModelPackageById = (params) => {
  return http.get(`/bus/userModelPackage/getUserModelPackageById`, params, { cancel: false })
}

//组件分页查询
export const pageComponentListApi = (params) => {
  return http.get(`/bus/userComponentPackage/pagePcList`, params, { cancel: false })
}

//启用组件
export const enableComponentPackageApi = (id) => {
  return http.post(`/bus/userComponentPackage/enable/${id}`, {}, { cancel: false })
}

//停用组件
export const stopComponentPackageApi = (id) => {
  return http.post(`/bus/userComponentPackage/stop/${id}`, {}, { cancel: false })
}

//查询开通列表
export const getUserModelPackageList = (params) => {
  return http.get(`/bus/userModelPackage/queryPackageList`, params, { cancel: false })
}

//查询个人有效模型量包
export const getUserModelBagList = (params) => {
  return http.get(`/bus/userModelPackage/getUserModelBagList`, params, { cancel: false })
}

//查询开启的组件
export const queryUserComponentPackageByLoginUser = (params) => {
  return http.get(`/bus/userComponentPackage/queryUserComponentPackageByLoginUser`, params, { cancel: false })
}

// 获取未开通的先用后付模型列表（一键开通弹框用）
export const listUnopenedPayLaterModelsApi = () => {
  return http.get(`/ai/model/listUnopenedPayLaterModels`, {}, { cancel: false })
}
