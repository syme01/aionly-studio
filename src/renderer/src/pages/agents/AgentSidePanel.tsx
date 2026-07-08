import { useRuntime } from '@renderer/hooks/useRuntime'
import { useNavbarPosition, useSettings } from '@renderer/hooks/useSettings'
import { cn } from '@renderer/utils'
import { Collapse } from 'antd'
import { useState } from 'react'
// import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import AddAgentButton from './components/AddAgentButton'
import AddSessionButton from './components/AddSessionButton'
import Agents from './components/Agents'
import Sessions from './components/Sessions'

interface AgentSidePanelProps {
  onSelectItem?: () => void
}

const AgentSidePanel = ({ onSelectItem }: AgentSidePanelProps) => {
  const { t } = useTranslation()
  const { chat } = useRuntime()
  const { activeAgentId } = chat
  const { isLeftNavbar, isTopNavbar } = useNavbarPosition()
  const { topicPosition } = useSettings()
  const [showAddAgentBtn, setShowAddAgentBtn] = useState(false)

  const sessionsOnRight = topicPosition === 'right'
  // const [tab, setTab] = useState<'agents' | 'sessions'>('agents')

  const onSetShowAddAgentBtn = (show: boolean) => {
    setShowAddAgentBtn(show)
  }

  const empty = (
    <div className="flex flex-1 items-center justify-center p-5 text-(--color-text-secondary) text-[13px]">
      {t('chat.alerts.select_agent')}
    </div>
  )

  const sideItems = [
    [
      {
        key: 'agents',
        label: t('agent.sidebar_title'),
        children: <Agents onSelectItem={onSelectItem} onSetShowAddAgentBtn={onSetShowAddAgentBtn} />
      }
    ],
    [
      {
        key: 'sessions',
        label: t('common.sessions'),
        children: activeAgentId ? <Sessions agentId={activeAgentId} onSelectItem={onSelectItem} /> : empty
      }
    ]
  ]

  return (
    <div
      className="flex flex-col overflow-hidden rounded-(--base-border-radius)"
      style={{
        width: 'var(--assistants-width)',
        height: 'calc(100vh - var(--navbar-height) - 10px)',
        // borderRight: isLeftNavbar ? '0.5px solid var(--color-border)' : 'none',
        backgroundColor: isLeftNavbar ? 'var(--color-background)' : undefined
      }}>
      {/* Tabs */}
      {!sessionsOnRight && (
        <div
          className={cn('mx-3 flex bg-transparent py-1.5', isTopNavbar && 'pt-0.5')}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/*<TabButton active={tab === 'agents'} onClick={() => setTab('agents')}>
            {t('agent.sidebar_title')}
          </TabButton>
          <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')}>
            {t('common.sessions')}
          </TabButton>*/}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-[15px]">
          {showAddAgentBtn && <AddAgentButton />}
          <CustomCollapse ghost items={sideItems[0]} defaultActiveKey={['agents']} />
          {activeAgentId && <AddSessionButton agentId={activeAgentId} />}
          <CustomCollapse ghost items={sideItems[1]} defaultActiveKey={['sessions']} />
        </div>

        {/*<Agents onSelectItem={onSelectItem} />
        {activeAgentId && (
          <Sessions agentId={activeAgentId} onSelectItem={onSelectItem} />
        )}*/}

        {/*{(sessionsOnRight || tab === 'agents') && <Agents onSelectItem={onSelectItem} />}
        {!sessionsOnRight && tab === 'sessions' && activeAgentId && (
          <Sessions agentId={activeAgentId} onSelectItem={onSelectItem} />
        )}
        {!sessionsOnRight && tab === 'sessions' && !activeAgentId && (
          <div className="flex flex-1 items-center justify-center p-5 text-(--color-text-secondary) text-[13px]">
            {t('chat.alerts.select_agent')}
          </div>
        )}*/}
      </div>
    </div>
  )
}

/*const TabButton: FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative mx-0.5 flex flex-1 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-[13px]',
      'h-7.5',
      'hover:text-(--color-text)',
      'active:scale-[0.98]',
      active ? 'font-semibold text-(--color-text)' : 'font-normal text-(--color-text-secondary)',
      // Underline indicator via pseudo-element
      'after:-translate-x-1/2 after:-bottom-2 after:absolute after:left-1/2 after:h-0.75 after:rounded-sm after:transition-all after:duration-200 after:ease-in-out',
      active
        ? 'after:w-7.5 after:bg-(--color-primary)'
        : 'after:w-0 after:bg-(--color-primary) hover:after:w-4 hover:after:bg-(--color-primary-soft)'
    )}>
    {children}
  </button>
)*/

const CustomCollapse = styled(Collapse)`
  .ant-collapse-header {
    padding: 0 10px !important;
    font-size: 12px;
    border: none !important;
    align-items: center !important;

    .ant-collapse-header-text {
      color: var(--color-text-3);
      font-size: 12px;
    }

    .ant-collapse-expand-icon {
      position: absolute;
      right: 0;
      color: var(--color-text-3);
      // transform: scale(0.8);
    }
  }

  .ant-collapse-content-box {
    padding: 0 !important;
    height: calc(50vh - 100px);
    overflow-y: auto;
  }
`

export default AgentSidePanel
