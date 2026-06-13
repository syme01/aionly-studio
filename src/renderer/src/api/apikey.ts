import http from '@renderer/utils/request'
export const addApikey = (params) => {
  return http.post(`/bus/apikey/addApikey`, params, { cancel: false })
}

export const getApikeyList = (params) => {
  return http.get(`/bus/apikey/getApikeyList`, params, { cancel: false })
}

export const updateApikey = (params) => {
  return http.post(`/bus/apikey/updateApikey`, params, { cancel: false })
}

export const deleteApikeyById = (params) => {
  return http.get(`/bus/apikey/deleteApikeyById`, params, { cancel: false })
}

export const addApikeyIpWhitelist = (params) => {
  return http.post(`/bus/apikeyIpWhitelist`, params, { cancel: false })
}

export const getApikeyIpWhitelist = (params) => {
  return http.get(`/bus/apikeyIpWhitelist/list`, params, { cancel: false })
}

export const updateApikeyIpWhitelist = (params) => {
  return http.put(`/bus/apikeyIpWhitelist`, params, { cancel: false })
}

export const deleteApikeyIpWhitelist = (params) => {
  return http.delete(`/bus/apikeyIpWhitelist/${params.id}`, params, { cancel: false })
}
