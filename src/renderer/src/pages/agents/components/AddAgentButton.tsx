import AgentModalPopup from '@renderer/components/Popups/agent/AgentModal'
import { useActiveAgent } from '@renderer/hooks/agents/useActiveAgent'
import { useApiServer } from '@renderer/hooks/useApiServer'
import type { AgentEntity } from '@types'
import { Button } from 'antd'
import { PlusIcon } from 'lucide-react'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const AddAgentButton: React.FC = () => {
  const { t } = useTranslation()
  const { apiServerRunning, startApiServer } = useApiServer()
  const { setActiveAgentId } = useActiveAgent()

  const handleAddAgent = useCallback(() => {
    void (!apiServerRunning && startApiServer())
    void AgentModalPopup.show({
      afterSubmit: (agent: AgentEntity) => {
        void setActiveAgentId(agent.id)
      }
    })
  }, [apiServerRunning, startApiServer, setActiveAgentId])

  return (
    <BtnWrapper>
      <Button
        type="primary"
        block
        icon={<PlusIcon size={16} style={{ flexShrink: 0 }} />}
        style={{ fontSize: '12px' }}
        onClick={handleAddAgent}>
        {t('agent.sidebar_agent.add')}
      </Button>
    </BtnWrapper>
  )
}

const BtnWrapper = styled.div`
  padding: 0 10px;
`

export default AddAgentButton
