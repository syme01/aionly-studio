import { PERSIST_KEY } from '@renderer/config/env'
import { SHOW_IN_USER_MENUS } from '@renderer/config/sidebar'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
import { modelGenerating, useRuntime } from '@renderer/hooks/useRuntime'
import { getSidebarIconLabel } from '@renderer/i18n/label'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { clearToken, selectUserInfo } from '@renderer/store/user'
import { Avatar, Modal, Popover } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
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

const UserInfoContainer = styled.div<{ theme: string }>`
  width: 180px;

  .user-info{
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 10px;
    border-bottom:  1px solid ${({ theme }) => (theme === 'dark' ? 'var(--color-gray-3)' : 'var(--color-gray-4)')};
  }

  .id-text{
    color: var(--color-gray-1);
    font-size: 12px;
  }
`

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`

const MenuItem = styled.div<{ theme: string }>`
  width: 100%;
  box-sizing: border-box;
  -webkit-app-region: none;
  padding: 5px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  .icon {
    // color: var(--color-icon);
  }
  &:hover {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-gray-4)')};
    opacity: 0.8;
    cursor: pointer;
    .icon {
      color: var(--color-icon-white);
    }
  }
  &.active {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-gray-4)')};
    .icon {
      color: var(--color-primary);
    }
    color: var(--color-primary);
  }
`

const UserAvatar: React.FC<Props> = () => {
  const { t } = useTranslation()
  const { hideMinappPopup } = useMinappPopup()
  const userInfo: any = useAppSelector(selectUserInfo)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { theme /*settedTheme, toggleTheme*/ } = useTheme()
  const { pathname } = useLocation()
  const { minappShow } = useRuntime()

  // const [hzBalance, setHzBalance] = useState(0)

  const menus = SHOW_IN_USER_MENUS

  /*const to = async (path: string) => {
    await modelGenerating()
    navigate(path)
  }*/

  /*const fetchMoneyConfig = useCallback(async () => {
    const res = await queryMoneyConfig()
    const data = res?.data
    const hzBalance = data?.hzBalance ? Number(data.hzBalance) : 0
    setHzBalance(hzBalance)
  }, [])

  useEffect(() => {
    fetchMoneyConfig()
  }, [fetchMoneyConfig])*/

  const handleLogout = (module: string) => {
    const title = `${module}.tip`
    const content = `${module}.confirm`
    const okText = `${module}.ok`
    const cancelText = `${module}.cancel`
    Modal.confirm({
      centered: true,
      title: t(title),
      content: t(content),
      okText: t(okText),
      cancelText: t(cancelText),
      onOk: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem(`persist:${PERSIST_KEY}`)
        dispatch(clearToken())
        navigate('/login')
      }
    })
  }

  const handleMenuClick = async (item: any) => {
    const notRealRoutePath = ['/identity', '/logout']
    if (notRealRoutePath.includes(item.path)) {
      const menuHandler = {
        '/identity': () => handleLogout('identity'),
        '/logout': () => handleLogout('logout')
      }
      menuHandler[item.path]?.()
    } else {
      hideMinappPopup()
      await modelGenerating()
      navigate(item.path)
    }
  }

  const UserInfoPanel = (
    <UserInfoContainer theme={theme} className="user-info-panel">
      <div className="user-info">
        {/*<div className="item money">
          <PayCircleOutlined />
          <span className="label">金币</span>
          <span className="text">{hzBalance.toFixed(2)}</span>
        </div>*/}
        <div className="avatar">
          <Avatar src={userInfo?.avatarUrl} size={34} />
        </div>
        <div className="info">
          <div className="nick-name">{userInfo?.nickName}</div>
          <div className="id-text">ID: {userInfo?.accountId}</div>
        </div>
      </div>

      <MenuContainer className="menu-list">
        {menus.map((item) => (
          <MenuItem
            theme={theme}
            className={pathname.startsWith(item.path) && !minappShow ? 'item active' : 'item'}
            key={item.path}
            onClick={() => handleMenuClick(item)}>
            <i className={`icon iconfont ${item.icon}`}></i>
            <span className="text">{getSidebarIconLabel(item.name)}</span>
          </MenuItem>
        ))}
        {/*<div
          className="item"
          onClick={async () => {
            hideMinappPopup()
            await to('/settings/provider')
          }}
        >
            <Icon theme={theme} className={pathname.startsWith('/settings') && !minappShow ? 'active' : ''}>
              <i className="icon iconfont icon-shezhi"></i>
            </Icon>
          <span className="text">{t('settings.title')}</span>
        </div>*/}
      </MenuContainer>
    </UserInfoContainer>
  )

  return (
    <Container className="user-avatar">
      <Popover content={UserInfoPanel} placement={'top'} align={{ offset: [10, -10] }} trigger="hover">
        <Avatar
          src={userInfo?.avatarUrl}
          style={{ backgroundColor: 'var(--color-inline-code-text)', verticalAlign: 'middle' }}
          size={40}>
          {userInfo?.nickName}
        </Avatar>
      </Popover>
    </Container>
  )
}

export default UserAvatar
