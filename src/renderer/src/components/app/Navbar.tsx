import { queryMoneyConfig } from '@renderer/api/balance'
import bullionImage from '@renderer/assets/images/home/bullion.png'
import { isLinux, isMac, isWin } from '@renderer/config/constant'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useFullscreen } from '@renderer/hooks/useFullscreen'
import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
import useNavBackgroundColor from '@renderer/hooks/useNavBackgroundColor'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { getThemeModeLabel } from '@renderer/i18n/label'
import { useAppSelector } from '@renderer/store'
import { selectToken } from '@renderer/store/user'
import { ThemeMode } from '@renderer/types'
import { useQuery } from '@tanstack/react-query'
import { Divider, Skeleton, Tooltip } from 'antd'
import { Monitor } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import type { FC, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import WindowControls from '../WindowControls'

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>

export const Navbar: FC<Props> = ({ children, ...props }) => {
  const { theme, settedTheme, toggleTheme } = useTheme()
  const { t } = useTranslation()

  const backgroundColor = useNavBackgroundColor()
  const isFullscreen = useFullscreen()
  const { isTopNavbar } = useNavbarPosition()
  const { minappShow } = useRuntime()
  const { handleToRecharge } = useMinappPopup()

  // 获取当前用户token，用于区分不同用户的缓存
  const token = useAppSelector(selectToken)

  // 使用 React Query 获取余额，自动处理缓存和重复请求
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['moneyConfig', token], // 添加token到queryKey，不同用户有独立缓存
    queryFn: async () => {
      const res = await queryMoneyConfig()
      return res?.data
    },
    enabled: !isTopNavbar && !minappShow && !!token, // 只在需要显示余额且已登录时才请求
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的，不会重新请求
    gcTime: 10 * 60 * 1000, // 缓存保留10分钟
    refetchOnMount: false, // 组件挂载时不自动重新请求
    refetchOnWindowFocus: false // 窗口聚焦时不自动重新请求
  })

  const hzBalance = balanceData?.hzBalance ? Number(balanceData.hzBalance) : 0

  if (isTopNavbar) {
    return null
  }

  return (
    <NavbarContainer {...props} style={{ backgroundColor }} $isFullScreen={isFullscreen}>
      {children}
      <>
        <RechargeContainer onClick={handleToRecharge}>
          <img className="img-bullion" src={bullionImage} alt="" />
          {isLoading ? (
            <Skeleton.Input active size="small" style={{ width: 60, height: 20, minWidth: 60 }} />
          ) : (
            <span className="money">{hzBalance.toFixed(2)}</span>
          )}
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          <span className="pay">{t('settings.provider.oauth.topup')}</span>
        </RechargeContainer>
        <Tooltip title={t('settings.theme.title') + ': ' + getThemeModeLabel(settedTheme)} placement="bottom">
          <Icon theme={theme} onClick={toggleTheme}>
            {settedTheme === ThemeMode.dark ? (
              /*<Moon size={20} className="icon" />*/
              <i className="icon iconfont icon-yueliang"></i>
            ) : settedTheme === ThemeMode.light ? (
              /* <Sun size={20} className="icon" />*/
              <i className="icon iconfont icon-ai250"></i>
            ) : (
              <Monitor size={20} className="icon" />
            )}
          </Icon>
        </Tooltip>
      </>
      <div style={{ visibility: minappShow ? 'hidden' : 'visible' }}>
        <WindowControls />
      </div>
    </NavbarContainer>
  )
}

export const NavbarLeft: FC<Props> = ({ children, ...props }) => {
  return <NavbarLeftContainer {...props}>{children}</NavbarLeftContainer>
}

export const NavbarCenter: FC<Props> = ({ children, ...props }) => {
  return <NavbarCenterContainer {...props}>{children}</NavbarCenterContainer>
}

export const NavbarRight: FC<Props> = ({ children, ...props }) => {
  const isFullscreen = useFullscreen()
  return (
    <NavbarRightContainer {...props} $isFullscreen={isFullscreen}>
      {children}
    </NavbarRightContainer>
  )
}

export const NavbarMain: FC<Props> = ({ children, ...props }) => {
  const isFullscreen = useFullscreen()
  return (
    <NavbarMainContainer {...props} $isFullscreen={isFullscreen}>
      {children}
    </NavbarMainContainer>
  )
}

export const NavbarHeader: FC<Props> = ({ children, ...props }) => {
  return <NavbarHeaderContent {...props}>{children}</NavbarHeaderContent>
}

const NavbarContainer = styled.div<{ $isFullScreen: boolean }>`
  min-width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: ${({ $isFullScreen }) => (!$isFullScreen && isMac ? 'env(titlebar-area-height)' : 'var(--navbar-height)')};
  max-height: var(--navbar-height);
  margin-left: ${isMac ? 'calc(var(--sidebar-width) * -1 + 2px)' : 0};
  padding-left: ${({ $isFullScreen }) =>
    isMac ? ($isFullScreen ? 'var(--sidebar-width)' : 'env(titlebar-area-x)') : 0};
  -webkit-app-region: drag;
`

const NavbarLeftContainer = styled.div`
  /* min-width: ${isMac ? 'calc(var(--assistants-width) - 20px)' : 'var(--assistants-width)'}; */
  padding: 0 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: bold;
  color: var(--color-text-1);
`

const NavbarCenterContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 ${isMac ? '20px' : 0};
  padding-left: 10px;
  font-weight: bold;
  color: var(--color-text-1);
  position: relative;
`

const NavbarRightContainer = styled.div<{ $isFullscreen: boolean }>`
  min-width: var(--topic-list-width);
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: flex-end;
  flex: 1;
`

const NavbarMainContainer = styled.div<{ $isFullscreen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-right: ${isMac ? '20px' : 0};
  padding-left: 10px;
  font-weight: bold;
  color: var(--color-text-1);
  padding-right: ${({ $isFullscreen }) => ($isFullscreen ? '12px' : isWin ? '140px' : isLinux ? '120px' : '12px')};
`

const NavbarHeaderContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  min-height: var(--navbar-height);
  max-height: var(--navbar-height);
`

const Icon = styled.div<{ theme: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  box-sizing: border-box;
  -webkit-app-region: none;
  border: 0.5px solid transparent;
  .icon {
    color: var(--color-icon);
    &.icon-ai250{
      font-size: 18px;
    }
  }
  &:hover {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    opacity: 0.8;
    cursor: pointer;
    .icon {
      color: var(--color-icon-white);
    }
  }
  &.active {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    border: 0.5px solid var(--color-border);
    .icon {
      color: var(--color-primary);
    }
  }

  @keyframes borderBreath {
    0% {
      opacity: 0.1;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.1;
    }
  }
`
const RechargeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px 12px;
  max-height: var(--navbar-height);
  border-color: rgba(255, 255, 255, 0);
  border-radius: 6px;
  box-shadow: 0 0 6px var(--color-white) inset;
  color: #ff6000;
  font-weight: 600;
  margin: 1px 10px 0 0;
  cursor: pointer;
  -webkit-app-region: none;

  &:hover {
    color: #f00;
  }

  .img-bullion {
    width: 18px;
    height: 18px;
  }
`
