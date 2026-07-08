import { CloseCircleFilled } from '@ant-design/icons'
import { Image } from 'antd'
import { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  files: any[]
  handleRemoveFile: (file: any) => boolean
}

const FilesCard: FC<Props> = ({ files, handleRemoveFile }) => {
  const { t } = useTranslation()
  return (
    <Container>
      {files.map((file) => (
        <FileItem key={file.uid}>
          <Image width="100%" src={file.url} alt={file.name} />
          <CloseCircleFilled
            className="icon-remove"
            title={t('common.delete')}
            onClick={() => handleRemoveFile(file)}
          />
        </FileItem>
      ))}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 5px 5px 0;
  overflow: hidden;
`

const FileItem = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-background-mute);
  border-radius: var(--base-border-radius);
  overflow: hidden;
  padding: 5px;
  position: relative;
  img{
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .icon-remove{
    position: absolute;
    top: 0;
    right: 0;
    display: none;
    cursor: pointer;
    color: var(--color-error);
    background-color: var(--color-white);
    border-radius: 50%;
  }
  &:hover{
    .icon-remove{
      display: block;
    }
  }
`

export default memo(FilesCard)
