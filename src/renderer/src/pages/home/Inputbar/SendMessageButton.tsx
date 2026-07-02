import type { FC, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  disabled: boolean
  sendMessage: () => void
}

const SendMessageButton: FC<Props> = ({ disabled, sendMessage }) => {
  const { t } = useTranslation()

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <SendButton disabled={disabled}>
      <i
        className="iconfont icon-fasongguanli"
        onClick={disabled ? undefined : sendMessage}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={t('chat.input.send')}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          // color: disabled ? 'var(--color-text-3)' : 'var(--color-primary)',
          fontSize: 16,
          transition: 'all 0.2s',
          marginTop: 1,
          marginRight: 2
        }}
      />
    </SendButton>
  )
}

const SendButton = styled.div<{ disabled?: boolean }>`
  width: 32px;
  height: 32px;
  background-color: ${({ disabled }) => (disabled ? 'var(--color-disabled-1)' : 'var(--color-primary)')};
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
`

export default SendMessageButton
