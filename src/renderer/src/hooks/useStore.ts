/**
 * @deprecated Scheduled for removal in v2.0.0
 * --------------------------------------------------------------------------
 * ⚠️ NOTICE: V2 DATA&UI REFACTORING (by 0xfullex)
 * --------------------------------------------------------------------------
 * STOP: Feature PRs affecting this file are currently BLOCKED.
 * Only critical bug fixes are accepted during this migration phase.
 *
 * This file is being refactored to v2 standards.
 * Any non-critical changes will conflict with the ongoing work.
 *
 * 🔗 Context & Status:
 * --------------------------------------------------------------------------
 */
import store, { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setAssistantsTabSortType,
  setShowAssistants,
  setShowTopics,
  toggleShowAssistants,
  toggleShowTopics
} from '@renderer/store/settings'
import type { AssistantsSortType } from '@renderer/types'

export function useShowAssistants() {
  const showAssistants = useAppSelector((state) => state.settings.showAssistants)
  const dispatch = useAppDispatch()

  return {
    showAssistants,
    setShowAssistants: (show: boolean) => dispatch(setShowAssistants(show)),
    toggleShowAssistants: () => dispatch(toggleShowAssistants())
  }
}

export function useShowTopics() {
  const showTopics = useAppSelector((state) => state.settings.showTopics)
  const dispatch = useAppDispatch()

  return {
    showTopics,
    setShowTopics: (show: boolean) => dispatch(setShowTopics(show)),
    toggleShowTopics: () => dispatch(toggleShowTopics())
  }
}

export function useAssistantsTabSortType() {
  const assistantsTabSortType = useAppSelector((state) => state.settings.assistantsTabSortType)
  const dispatch = useAppDispatch()

  return {
    assistantsTabSortType,
    setAssistantsTabSortType: (sortType: AssistantsSortType) => dispatch(setAssistantsTabSortType(sortType))
  }
}

export function getStoreProviders() {
  // 屏蔽 marketapi provider
  // return store.getState().llm.providers.concat([MARKETAPI_PROVIDER])
  return store.getState().llm.providers
}
