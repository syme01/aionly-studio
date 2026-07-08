import { useCreateDefaultSession } from '@renderer/hooks/agents/useCreateDefaultSession'
import { Button } from 'antd'
import { PlusIcon } from 'lucide-react'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  agentId: string
}

const AddSessionButton: React.FC<Props> = ({ agentId }) => {
  const { t } = useTranslation()

  const { createDefaultSession, creatingSession } = useCreateDefaultSession(agentId)

  return (
    <BtnWrapper>
      <Button
        type="primary"
        block
        icon={<PlusIcon size={16} style={{ flexShrink: 0 }} />}
        disabled={creatingSession}
        style={{ fontSize: '12px' }}
        onClick={createDefaultSession}>
        {t('agent.session.add.title')}
      </Button>
    </BtnWrapper>
  )
}

const BtnWrapper = styled.div`
  padding: 0 10px;
`

export default memo(AddSessionButton)
