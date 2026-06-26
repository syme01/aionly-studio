import { LogoutOutlined, PayCircleOutlined } from '@ant-design/icons'
import { queryMoneyConfig } from '@renderer/api/balance'
import { PERSIST_KEY } from '@renderer/config/env'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { clearToken, selectUserInfo } from '@renderer/store/user'
import { Avatar, Popover } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

interface Props {
  children?: React.ReactNode
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: none;
`

const UserInfoContainer = styled.div`
  .user-info{
    .item{
      padding: 0 10px 10px;
      cursor: pointer;
      display: flex;
      gap: 10px;
      margin-top: 10px;

      &:hover{
        color: var(--color-primary);
      }

      &:not(:last-child) {
        border-bottom: 1px solid #eee;
      }
      &.money{
        .text{
          color: rgba(255, 96, 0, 1);
          font-weight: bold;
        }
      }
    }
  }
`

const UserAvatar: React.FC<Props> = () => {
  const userInfo: any = useAppSelector(selectUserInfo)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [hzBalance, setHzBalance] = useState(0)

  const fetchMoneyConfig = useCallback(async () => {
    const res = await queryMoneyConfig()
    const data = res.data
    const hzBalance = data.hzBalance ? Number(data.hzBalance) : 0
    setHzBalance(hzBalance)
  }, [])

  useEffect(() => {
    fetchMoneyConfig()
  }, [fetchMoneyConfig])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem(`persist:${PERSIST_KEY}`)
    dispatch(clearToken())
    navigate('/login')
  }

  const UserInfoPanel = (
    <UserInfoContainer className="user-info-panel">
      <div className="user-info">
        <div className="item money">
          <PayCircleOutlined />
          <span className="label">金币</span>
          <span className="text">{hzBalance.toFixed(2)}</span>
        </div>
        <div className="item" onClick={handleLogout}>
          <LogoutOutlined />
          <span className="text">退出登录</span>
        </div>
      </div>
    </UserInfoContainer>
  )

  return (
    <Container className="user-avatar">
      <Popover content={UserInfoPanel} title={userInfo?.nickName} placement={'top'} trigger="hover">
        <Avatar
          src={userInfo?.avatarUrl}
          style={{ backgroundColor: 'var(--color-inline-code-text)', verticalAlign: 'middle' }}
          size={26}>
          {userInfo?.nickName}
        </Avatar>
      </Popover>
    </Container>
  )
}

export default UserAvatar
