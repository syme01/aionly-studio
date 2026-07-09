import { getModelLogo } from '@renderer/config/models'
import type { Model } from '@renderer/types'
import type { AvatarProps } from 'antd'
import { Avatar } from 'antd'
import { first } from 'lodash'
import { FC, useMemo } from 'react'

interface Props {
  model?: Model | any
  size: number
  props?: AvatarProps
  className?: string
}

const ModelAvatar: FC<Props> = ({ model, size, props, className }) => {
  const modelLogo = useMemo(() => {
    return model?.modelFileUrl ?? getModelLogo(model)
  }, [model])

  return (
    <Avatar
      src={modelLogo}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...props}
      className={className}>
      {first(model?.name)}
    </Avatar>
  )
}

export default ModelAvatar
