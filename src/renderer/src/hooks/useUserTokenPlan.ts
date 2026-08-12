import { loggerService } from '@logger'

const useUserTokenPlan = (userId: string) => {
  const ENABLED_PLAN_STORAGE_KEY = `enabled_plan_${userId}`

  const logger = loggerService.withContext('TokenPlanCache')

  const getUserEnabledPlan = () => {
    try {
      const raw = localStorage.getItem(ENABLED_PLAN_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const setUserEnabledPlan = (plan: any) => {
    try {
      localStorage.setItem(ENABLED_PLAN_STORAGE_KEY, JSON.stringify(plan))
    } catch {
      logger.error('Failed to store enabled plan')
    }
  }

  const clearUserEnabledPlan = () => {
    try {
      localStorage.removeItem(ENABLED_PLAN_STORAGE_KEY)
    } catch {
      logger.error('Failed to clear enabled plan')
    }
  }

  return {
    ENABLED_PLAN_STORAGE_KEY,
    getUserEnabledPlan,
    setUserEnabledPlan,
    clearUserEnabledPlan
  }
}

export default useUserTokenPlan
