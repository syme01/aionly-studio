import bg from '@renderer/assets/images/home/welcome.png'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const Welcome: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Container>
      <img className="image-welcome" src={bg} alt="" />
      <div className="text">{t('chat.welcome')}</div>
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;

  .image-welcome {
    width: 130px;
  }

  .text {
    text-align: center;
    font-family: Alimama ShuHeiTi;
    font-weight: 700;
    color: var(--text-color);
    font-size: 26px;
    letter-spacing: 5px;
  }
`

export default Welcome
