import http from '@renderer/utils/request'

const ModuleName = '/system'

/**
 * @name 用户管理模块
 */
// 获取用户列表
export const getUserList = (params) => {
  return http.post(ModuleName + `/user/list`, params)
}

// 获取树形用户列表
export const getUserTreeList = (params) => {
  return http.post(ModuleName + `/user/tree/list`, params)
}

// 新增用户
export const addUser = (params) => {
  return http.post(ModuleName + `/user/add`, params)
}

// 批量添加用户
export const BatchAddUser = (params) => {
  return http.post(ModuleName + `/user/import`, params)
}

// 编辑用户
export const editUser = (params) => {
  return http.post(ModuleName + `/user/edit`, params)
}

// 删除用户
export const deleteUser = (params) => {
  return http.post(ModuleName + `/user/delete`, params)
}

// 切换用户状态
export const changeUserStatus = (params) => {
  return http.post(ModuleName + `/user/change`, params)
}

// 重置用户密码
export const resetUserPassWord = (params) => {
  return http.post(ModuleName + `/user/rest_password`, params)
}

// 导出用户数据
export const exportUserInfo = (params) => {
  return http.download(ModuleName + `/user/export`, params)
}

// 获取用户状态字典
export const getUserStatus = () => {
  return http.get(ModuleName + `/user/status`, {}, { cancel: false })
}

// 获取用户性别字典
export const getUserGender = async () => {
  return await http.get(ModuleName + `/user/gender`, {}, { cancel: false })
}

// 获取用户部门列表
export const getUserDepartment = () => {
  return http.get(ModuleName + `/user/department`, {}, { cancel: false })
}

// 获取用户角色字典
export const getUserRole = () => {
  return http.get(ModuleName + `/user/role`, {}, { cancel: false })
}
// 获取用户信息
export const getUserProfile = () => {
  return http.get(`/bus/userProfile/profile`, {}, { cancel: false })
}

// 获取当前用户数据（静默请求；时间戳 + 禁用缓存头，避免浏览器/代理返回旧数据）
export const getCurrentUserData = () => {
  return http.get(
    `/bus/userProfile/profile`,
    { times: Date.now(), randoms: Math.floor(Math.random() * 900) + 100 },
    {
      loading: false,
      headers: {
        // "Cache-Control": "no-cache",
        // Pragma: "no-cache"
      }
    }
  )
}

// 修改手机号
export const replacePhoneApi = (params) => {
  return http.get(`/resource/sms/replacePhone`, params, { loading: false, headers: { isToken: true, isEncrypt: true } }) // 正常 post json 请求  ==>  application/json
}

// 确认修改手机号
export const replaceSurePhoneApi = (params) => {
  return http.get(`/resource/sms/replaceSurePhone`, params, {
    loading: false,
    headers: { isToken: true, isEncrypt: true }
  }) // 正常 post json 请求  ==>  application/json
}

//修改手机号验证码验证
export const replaceValidateCodeApi = (params) => {
  return http.post(`/bus/userProfile/replaceValidateCode`, params, {
    loading: false,
    headers: { isToken: true, isEncrypt: true }
  })
}

//更改手机号
export const replaceSureValidateCodeApi = (params) => {
  return http.post(`/bus/userProfile/replaceSureValidateCode`, params, {
    loading: false,
    headers: { isToken: true, isEncrypt: true }
  })
}

/**
 * @name 头像上传
 */
// 图片上传
export const uploadAvatarApi = (params) => {
  return http.post(`/bus/userProfile/avatar`, params, { cancel: false })
}

/**
 * @name 修改信息
 */
export const updateProfileApi = (params) => {
  return http.post(`/bus/userProfile/updateProfile`, params, { cancel: false })
}

export const getUserGroupList = (params) => {
  return http.get(`/bus/userGroup/getUserGroupList`, params, { cancel: false })
}
export const addUserGroup = (params) => {
  return http.post(`/bus/userGroup/addUserGroup`, params, { cancel: false })
}
export const updateUserGroup = (params) => {
  return http.post(`/bus/userGroup/updateUserGroup`, params, { cancel: false })
}
export const deleteUserGroupById = (params) => {
  return http.get(`/bus/userGroup/deleteUserGroupById`, params, { cancel: false })
}

export const addUserInfo = (params) => {
  return http.post(`/bus/userInfo/addUserInfo`, params, { cancel: false })
}

export const updateUserInfo = (params) => {
  return http.post(`/bus/userInfo/updateUserInfo`, params, { cancel: false })
}

export const editUserInfo = (params) => {
  return http.post(`/bus/userInfo/editUserInfo`, params, { cancel: false, headers: { isToken: false } })
}

export const updateLoginUser = () => {
  return http.post(`/bus/userInfo/updateLoginUser`, null, { cancel: false })
}

export const groupselect = (params) => {
  return http.get(`/bus/userGroup/groupselect`, params, { cancel: false })
}

export const getUserInfoWebList = (params) => {
  return http.get(`/bus/userInfo/getUserInfoWebList`, params, { cancel: false })
}

export const getUserInfoWebConfigList = (params) => {
  return http.get(`/bus/userInfo/getUserInfoWebConfigList`, params, { cancel: false })
}

export const queryByUserId = (params) => {
  return http.get(`/bus/userBalCfg/queryByUserId/` + params, null, { cancel: false })
}

export const getUserGroupWebList = (params) => {
  return http.get(`/bus/userInfo/getUserGroupWebList`, params, { cancel: false })
}

export const queryGruopUser = (params) => {
  return http.get(`/bus/userInfo/queryGruopUser`, params, { cancel: false })
}

export const UserChangeStatus = (userId, status) => {
  return http.post(`/bus/userInfo/UserChangeStatus?userId=` + userId + `&status=` + status, null, { cancel: false })
}

export const deleteUserInfoById = (params) => {
  return http.get(`/bus/userInfo/deleteUserInfoById`, params, { cancel: false })
}
export const queryUserInfo = (params) => {
  return http.get(`/bus/userInfo/queryUserInfo`, params, { cancel: false })
}
//根据手机号获取用户信息
export const queryUserByPhone = (params) => {
  return http.get(
    `/bus/userInfo/queryUserByPhone?phoneNumber=` + params,
    {},
    { cancel: false, headers: { isToken: false } }
  )
}

export const queryUserByEmail = (params) => {
  return http.get(`/bus/userInfo/queryUserByEmail?email=` + params, {}, { cancel: false, headers: { isToken: false } })
}

export const checkBindTargetExists = (params) => {
  return http.get(`/bus/userInfo/checkBindTargetExists`, params, { cancel: false, headers: { isToken: false } })
}

export const queryPhoneByName = (userName, phoneNumber) => {
  return http.get(`/bus/userInfo/queryPhoneByName?userName=` + userName + `&phoneNumber=` + phoneNumber, null, {
    cancel: false,
    headers: { isToken: false }
  })
}

/*修改认证类型、状态*/
export const userChangeAuthTypeStatus = (params) => {
  return http.post(`/bus/userInfo/userChangeAuthTypeStatus`, params, { cancel: false })
}

//获取用户详细信息
export const getUserInfoOne = (params) => {
  return http.get(`/bus/userInfo/` + params, null, { cancel: false, loading: false })
}

//接收消息配置
export const messageReceive = (params) => {
  return http.post(`/bus/userInfo/messageReceive`, params, { cancel: false })
}

//接收消息配置
export const messageReceiveAll = (params) => {
  return http.post(`/bus/userInfo/messageReceiveAll`, params, { cancel: false })
}

//获取用户是否后付用户
export const getIsPayLaterUser = () => {
  return http.get(`/bus/userInfo/getIsPayLaterUser`, null, { cancel: false, loading: false })
}

/** 更新自动开通新上架模型开关，请求体 { autoOpenModel: 0 | 1 } */
export const updateAutoOpenModel = (params) => {
  return http.put(`/bus/userInfo/updateAutoOpenModel`, params, { cancel: false })
}

export const addCfg = (params) => {
  return http.post(`/bus/userBalCfg`, params, { cancel: false, loading: false })
}

export const updateCfg = (params) => {
  return http.put(`/bus/userBalCfg`, params, { cancel: false, loading: false })
}
