import { CrownFilled } from '@ant-design/icons'
import type { Model } from '@renderer/types'
import React, { memo } from 'react'
import styled from 'styled-components'

import ModelTagsWithLabel from './ModelTagsWithLabel'

interface ModelIdWithTagsProps {
  model: Model
  fontSize?: number
  showIdentifier?: boolean
  style?: React.CSSProperties
}

const ModelIdWithTags = ({
  ref,
  model,
  fontSize = 14,
  showIdentifier = false,
  style
}: ModelIdWithTagsProps & { ref?: React.RefObject<HTMLDivElement> | null }) => {
  const shouldShowIdentifier = showIdentifier && model.id !== model.name

  return (
    <div
      ref={ref}
      className="flex min-w-0 items-center gap-2.5 font-semibold text-(--color-text) leading-[1.2]"
      style={{ fontSize, ...style }}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="block min-w-0 shrink overflow-hidden text-ellipsis whitespace-nowrap leading-[1.3]">
          {model.name}
        </span>
        {(model as any)?.memberSpecial == 1 && (
          <IconVip>
            <CrownFilled />
            <span>vip</span>
          </IconVip>
        )}
        {shouldShowIdentifier && (
          <span
            className="min-w-0 max-w-[50%] shrink truncate font-mono text-(--color-text-3) text-[12px]! leading-[1.2]"
            title={model.id}>
            {model.id}
          </span>
        )}
      </div>
      <ModelTagsWithLabel model={model} size={11} style={{ flexShrink: 0 }} />
    </div>
  )
}

const IconVip = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  color: var(--color-white);
  width: 52px;
  padding: 4px 0;
  background: linear-gradient(90deg,#ffaa00 0%,#f77a1d 100%);
  border-radius: 4px;
  font-size: 12px;
`

export default memo(ModelIdWithTags)
