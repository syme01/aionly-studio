import { WarningFilled } from '@ant-design/icons'
import HorizontalScrollContainer from '@renderer/components/HorizontalScrollContainer'
import NavbarIcon from '@renderer/components/NavbarIcon'
import { useActiveSession } from '@renderer/hooks/agents/useActiveSession'
import { useUpdateAgent } from '@renderer/hooks/agents/useUpdateAgent'
import { useUpdateSession } from '@renderer/hooks/agents/useUpdateSession'
import { useFetchAndSetupModels } from '@renderer/hooks/useAiOnlyModels'
import { useProvider } from '@renderer/hooks/useProvider'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { useShowAssistants } from '@renderer/hooks/useStore'
import { AgentSettingsPopup /*SessionSettingsPopup*/ } from '@renderer/pages/settings/AgentSettings'
import AiOnlyAddModelPopup from '@renderer/pages/settings/ProviderSettings/AiOnlyModel/add/AddModelPopup'
import { selectAiOnlyModels } from '@renderer/store/user'
// import { AgentLabel, SessionLabel } from '@renderer/pages/settings/AgentSettings/shared'
import type { AgentEntity, ApiModel } from '@renderer/types'
import { Button, Tooltip } from 'antd'
import { t } from 'i18next'
// import { ChevronRight } from 'lucide-react'
import { Menu, PanelLeftClose, PanelRightClose } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import AgentSidePanelDrawer from '../AgentSidePanelDrawer'
import SelectAgentBaseModelButton from '../SelectAgentBaseModelButton'
import OpenExternalAppButton from './OpenExternalAppButton'
// import SessionWorkspaceMeta from './SessionWorkspaceMeta'
import Tools from './Tools'

type AgentContentProps = {
  activeAgent: AgentEntity
}

const AgentContent = ({ activeAgent }: AgentContentProps) => {
  const { showAssistants, toggleShowAssistants } = useShowAssistants()
  const { isTopNavbar } = useNavbarPosition()
  const { session: activeSession } = useActiveSession()
  const { updateAgent } = useUpdateAgent()
  const { updateModel: updateSessionModel } = useUpdateSession(activeAgent?.id ?? null)
  const { provider } = useProvider('aionly')

  const handleUpdateModel = useCallback(
    async (model: ApiModel) => {
      if (!activeAgent || !activeSession) return

      const updatedAgent = await updateAgent({ id: activeAgent.id, model: model.id }, { showSuccessToast: false })
      if (!updatedAgent) return

      return updateSessionModel(activeSession.id, model.id, { showSuccessToast: false })
    },
    [activeAgent, activeSession, updateAgent, updateSessionModel]
  )

  // 获取用户预存的 aiOnly 模型列表（前10条）
  const aiOnlyModels = useSelector(selectAiOnlyModels)
  const setupModels = useFetchAndSetupModels()

  // 判断是否没有 aiOnly 模型
  const noModels = useMemo(() => {
    return aiOnlyModels && aiOnlyModels.length === 0
  }, [aiOnlyModels])

  // 开通模型
  const handleOpenModel = async () => {
    const result = await AiOnlyAddModelPopup.show({ provider })
    if (result.success) {
      await setupModels(10)
    }
  }

  return (
    <div className="flex w-full justify-between pr-2">
      <div className="flex min-w-0 shrink items-center">
        {isTopNavbar && showAssistants && (
          <Tooltip title={t('navbar.hide_sidebar')} mouseEnterDelay={0.8}>
            <NavbarIcon onClick={toggleShowAssistants}>
              <PanelLeftClose size={18} />
            </NavbarIcon>
          </Tooltip>
        )}
        {isTopNavbar && !showAssistants && (
          <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={0.8} placement="right">
            <NavbarIcon onClick={() => toggleShowAssistants()} style={{ marginRight: 8 }}>
              <PanelRightClose size={18} />
            </NavbarIcon>
          </Tooltip>
        )}
        <AnimatePresence initial={false}>
          {!showAssistants && isTopNavbar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}>
              <NavbarIcon onClick={() => AgentSidePanelDrawer.show()} style={{ marginRight: 5 }}>
                <Menu size={18} />
              </NavbarIcon>
            </motion.div>
          )}
        </AnimatePresence>
        <HorizontalScrollContainer className="ml-2 min-w-0 flex-initial shrink">
          <div className="flex flex-nowrap items-center gap-2">
            {/* Agent Label */}
            <div
              className="flex h-full cursor-pointer items-center"
              onClick={() => AgentSettingsPopup.show({ agentId: activeAgent.id })}>
              {/* <AgentLabel
                agent={activeAgent}
                classNames={{ name: 'max-w-40 text-xs', avatar: 'h-4.5 w-4.5', container: 'gap-1.5' }}
              />*/}
              <span>{activeAgent.name}</span>
            </div>

            {activeSession && (
              <>
                {/* Separator */}
                {/*<ChevronRight className="h-4 w-4 text-gray-400" />*/}

                {/* Session Label */}
                {/*<div
                  className="flex h-full cursor-pointer items-center"
                  onClick={() =>
                    SessionSettingsPopup.show({
                      agentId: activeAgent.id,
                      sessionId: activeSession.id
                    })
                  }>
                  <SessionLabel session={activeSession} className="max-w-40 text-xs" />
                </div>*/}

                {/* Separator */}
                {/* <ChevronRight className="h-4 w-4 text-gray-400" />*/}

                {/* Model Button */}
                {noModels ? (
                  <>
                    <TipText className="tips">
                      <WarningFilled />
                      {t('chat.topics.no_model')}
                    </TipText>
                    <Button type="primary" size="small" onClick={handleOpenModel}>
                      {t('chat.topics.open_model_text')}
                    </Button>
                  </>
                ) : (
                  <SelectAgentBaseModelButton
                    agentBase={activeSession}
                    onSelect={async (model) => {
                      await handleUpdateModel(model)
                    }}
                  />
                )}

                {/* Separator */}
                {/*<ChevronRight className="h-4 w-4 text-gray-400" />*/}

                {/* Workspace Meta */}
                {/*<SessionWorkspaceMeta agent={activeAgent} session={activeSession} />*/}
              </>
            )}
          </div>
        </HorizontalScrollContainer>
      </div>
      {aiOnlyModels && aiOnlyModels.length > 0 && (
        <div className="flex items-center">
          {/* Open External Apps */}
          {activeSession && activeSession.accessible_paths?.[0] && (
            <OpenExternalAppButton workdir={activeSession.accessible_paths[0]} className="mr-2" />
          )}
          <Tools />
        </div>
      )}
    </div>
  )
}

const TipText = styled.span`
  color: var(--color-red-600);
  font-size: 14px;
`

export default AgentContent
