import http from '@renderer/utils/request'

//获取列表
export const queryDayListApi = (params) => {
  return http.get(`/ai/userDayBill/queryDayList`, params, { cancel: false })
}

//获取按天分账列表
export const queryRevenueDayList = (params) => {
  return http.get(`/ai/userDayBill/queryRevenueDayList`, params, { cancel: false })
}

//按天分账账单导出（按筛选条件导出全部）
export const exportRevenueDayListApi = (params) => {
  return http.download(`/ai/userDayBill/exportRevenueDayList`, params, { cancel: false })
}

//按月分账账单导出（按筛选条件导出全部）
export const exportRevenueMonthListApi = (params) => {
  return http.download(`/ai/userDayBill/exportRevenueMonthList`, params, { cancel: false })
}

//获取按月分账列表
export const queryRevenueMonthList = (params) => {
  return http.get(`/ai/userDayBill/queryRevenueMonthList`, params, { cancel: false })
}
//获取天数据
export const selectHourlyDayUsageApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectClientHourlyDayUsage`, params, { cancel: false })
}

//获取小时数据
export const selectHourlyUsageApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectHourlyUsage`, params, { cancel: false })
}

//获取天总合
export const querySumDayStaApi = (params) => {
  return http.get(`/ai/userDayBill/querySumDaySta`, params, { cancel: false })
}

//获取分账天总合
export const queryDayRevenueSum = (params) => {
  return http.get(`/ai/userDayBill/queryDayRevenueSum`, params, { cancel: false })
}

//获取分账月总合
export const queryMonthRevenueSum = (params) => {
  return http.get(`/ai/userDayBill/queryMonthRevenueSum`, params, { cancel: false })
}

//模型小时合计
export const selectHourlyUsageStaApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectHourlyUsageSta`, params, { cancel: false })
}

//获取月列表
export const queryMonthListApi = (params) => {
  return http.get(`/ai/userMonthBill/queryMonthList`, params, { cancel: false })
}

//获取月总合
export const querySumMonthStaApi = (params) => {
  return http.get(`/ai/userMonthBill/querySumMonthSta`, params, { cancel: false })
}

//获取月数据
export const selectHourlyMonthUsageApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectClientHourlyMonthUsage`, params, { cancel: false })
}

//获取天数据
export const selectHourlyOfMonthUsageApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectHourlyOfMonthUsage`, params, { cancel: false })
}

//获取天总数
export const selectHourlyOfMonthUsageStaApi = (params) => {
  return http.get(`/ai/modelHourlyUsage/selectHourlyOfMonthUsageSta`, params, { cancel: false })
}

//获取我的金币
export const getMyBalanceApi = () => {
  return http.get(`/money/userBalance/getMyBalance`, {}, { cancel: false })
}

//补款
export const supplementaryPaymentApi = (params) => {
  return http.post(`/ai/userDayBill/supplementaryPayment`, params, { cancel: false, headers: { isEncrypt: true } })
}

// 导出订购产品明细
export const exportDetailApi = (params) => {
  return http.download(`/ai/modelHourlyUsage/exportDetail`, params, { cancel: false })
}

// 批量导出按天账单详情(zip)
export const exportDetailBatchDayApi = (params) => {
  return http.download(`/ai/modelHourlyUsage/exportDetailBatchDay`, params, { cancel: false })
}

// 批量导出按月账单详情(zip)
export const exportDetailBatchMonthApi = (params) => {
  return http.download(`/ai/modelHourlyUsage/exportDetailBatchMonth`, params, { cancel: false })
}

// 查看明细弹框导出（列与弹框表格一致，含合计行）
export const exportBillDetailDialogApi = (params) => {
  return http.downloadForm(`/ai/modelHourlyUsage/exportBillDetailDialog`, params, { cancel: false })
}

//获取token plan数据
export const selectTokenPlanHourlyDayUsageApi = (params: any) => {
  return http.get(`/ai/modelHourlyUsage/selectTokenPlanHourlyDayUsage`, params, { cancel: false })
}
export const deleteTokenPlanApi = (params) => {
  return http.delete(`/ai/tokenPlanSubscribe/${params.id}`, params, { cancel: false })
}
