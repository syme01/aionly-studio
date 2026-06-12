import { message } from 'antd'

/**
 * @description: 校验网络请求状态码
 * @param {Number} status
 * @return void
 */
export const checkStatus = (status, msg, showError) => {
  switch (status) {
    case 400:
      message.error('请求失败！请您稍后重试')
      break
    case 401:
      message.error('请您先注册/登录')
      break
    case 403:
      message.error('当前账号无权限访问！')
      break
    case 404:
      message.error('你所访问的资源不存在！')
      break
    case 405:
      message.error('请求方式错误！请您稍后重试')
      break
    case 408:
      message.error('请求超时！请您稍后重试')
      break
    case 500:
      msg = msg ? msg : '服务异常！'
      if (showError) message.error(msg)
      break
    case 502:
      msg = msg ? msg : '网关错误！'
      message.error(msg)
      break
    case 503:
      msg = msg ? msg : '服务不可用！'
      message.error(msg)
      break
    case 504:
      msg = msg ? msg : '网关超时！'
      message.error(msg)
      break
    default:
      msg = msg ? msg : '请求失败！'
      message.error(msg)
  }
}
