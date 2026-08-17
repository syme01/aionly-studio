import { loggerService } from '@logger'
import { ENABLED_PLAN_STORAGE_KEY } from '@shared/config/constant'

const useUserTokenPlan = (userId: string) => {
  const KEY = `${ENABLED_PLAN_STORAGE_KEY}_${userId}`

  const logger = loggerService.withContext('TokenPlanCache')

  const getUserEnabledPlan = () => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const setUserEnabledPlan = (plan: any) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plan))
    } catch {
      logger.error('Failed to store enabled plan')
    }
  }

  const clearUserEnabledPlan = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      logger.error('Failed to clear enabled plan')
    }
  }

  return {
    KEY,
    getUserEnabledPlan,
    setUserEnabledPlan,
    clearUserEnabledPlan
  }
}

export default useUserTokenPlan
