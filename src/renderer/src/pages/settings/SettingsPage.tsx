import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
// import { McpLogo } from '@renderer/components/Icons'
import Scrollbar from '@renderer/components/Scrollbar'
import ModelSettings from '@renderer/pages/settings/ModelSettings/ModelSettings'
import { Divider as AntDivider } from 'antd'
/*import {
  Brain,
  CalendarClock,
  Cloud,
  Command,
  FileCode,
  HardDrive,
  Info,
  MonitorCog,
  Package,
  PictureInPicture2,
  Search,
  Server,
  Settings2,
  Sparkles,
  TextCursorInput,
  Zap
} from 'lucide-react'*/
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import AboutSettings from './AboutSettings'
import ChannelsSettings from './ChannelsSettings'
import DataSettings from './DataSettings/DataSettings'
import DisplaySettings from './DisplaySettings/DisplaySettings'
import DocProcessSettings from './DocProcessSettings'
import GeneralSettings from './GeneralSettings'
import MCPSettings from './MCPSettings'
import MemorySettings from './MemorySettings'
import { ProviderList } from './ProviderSettings'
import QuickAssistantSettings from './QuickAssistantSettings'
import QuickPhraseSettings from './QuickPhraseSettings'
import SelectionAssistantSettings from './SelectionAssistantSettings/SelectionAssistantSettings'
import ShortcutSettings from './ShortcutSettings'
import SkillsSettings from './SkillsSettings'
import TasksSettings from './TasksSettings'
import { ApiServerSettings } from './ToolSettings/ApiServerSettings'
import WebSearchSettings from './WebSearchSettings'

const SettingsPage: FC = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const isRoute = (path: string): string => (pathname.startsWith(path) ? 'active' : '')

  // 一次性导入 settings 目录下所有 PNG
  const iconModules = import.meta.glob('@renderer/assets/images/settings/*.png', {
    eager: true,
    import: 'default'
  }) as Record<string, string>

  const getMenuIcon = (iconName: string) => {
    // 从路径中提取文件名
    const iconPath = Object.entries(iconModules).find(([path]) => path.includes(`${iconName}.png`))?.[1]

    if (!iconPath) return null

    return <img src={iconPath} alt={iconName} style={{ width: '18px', height: '18px' }} />
  }

  const groupedMenus = [
    {
      group: t('settings.menus.model.title'), // 模型能力
      menus: [
        {
          label: t('settings.provider.title'), // 模型服务
          icon: getMenuIcon('provider'),
          path: '/settings/provider'
        },
        {
          label: t('settings.model'), // 默认模型
          icon: getMenuIcon('model'),
          path: '/settings/model'
        },
        // TODO: 临时屏蔽：全局记忆需要嵌入模型，aionly平台暂时没有嵌入模型
        /*{
          label: t('memory.title'), // 全局记忆
          icon: getMenuIcon('memory'),
          path: '/settings/memory'
        },*/
        {
          label: t('apiServer.title'), // API 服务
          icon: getMenuIcon('api-server'),
          path: '/settings/api-server'
        }
      ]
    },
    {
      group: t('settings.menus.system.title'), // 系统设置
      menus: [
        {
          label: t('settings.general.label'), // 常规设置
          icon: getMenuIcon('general'),
          path: '/settings/general'
        },
        {
          label: t('settings.display.title'), // 显示设置
          icon: getMenuIcon('display'),
          path: '/settings/display'
        },
        {
          label: t('settings.data.title'), // 数据设置
          icon: getMenuIcon('data'),
          path: '/settings/data'
        },
        {
          label: t('settings.mcp.title'), // MCP服务器
          icon: getMenuIcon('mcp'),
          path: '/settings/mcp'
        },
        {
          label: t('settings.skills.title'), // 技能
          icon: getMenuIcon('skills'),
          path: '/settings/skills'
        },
        {
          label: t('settings.tool.websearch.title'), // 网络搜索
          icon: getMenuIcon('websearch'),
          path: '/settings/websearch'
        }
      ]
    },
    {
      group: t('settings.menus.quick.title'), // 快捷工具
      menus: [
        {
          label: t('settings.quickPhrase.title'), // 快捷短语
          icon: getMenuIcon('quickphrase'),
          path: '/settings/quickphrase'
        },
        {
          label: t('settings.shortcuts.title'), // 快速键
          icon: getMenuIcon('shortcut'),
          path: '/settings/shortcut'
        },
        {
          label: t('settings.quickAssistant.title'), // 快速助手
          icon: getMenuIcon('quickAssistant'),
          path: '/settings/quickAssistant'
        },
        {
          label: t('selection.name'), // 划词助手
          icon: getMenuIcon('selectionAssistant'),
          path: '/settings/selectionAssistant'
        }
      ]
    },
    {
      group: t('settings.menus.other.title'), // 其他
      menus: [
        {
          label: t('settings.about.label'), // 关于我们
          icon: getMenuIcon('about'),
          path: '/settings/about'
        }
      ]
    }
  ]

  return (
    <Container className="page-container">
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('settings.title')}</NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        <SettingMenus>
          {groupedMenus.map((group, index) => (
            <React.Fragment key={group.group}>
              <div className="group-item" key={group.group}>
                <div className="group-name">{group.group}</div>
                {group.menus.map((menu) => (
                  <MenuItemLink to={menu.path} key={menu.path}>
                    <MenuItem className={isRoute(menu.path)}>
                      {menu.icon}
                      {menu.label}
                    </MenuItem>
                  </MenuItemLink>
                ))}
              </div>
              {index < groupedMenus.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </SettingMenus>

        {/*<SettingMenus>
          <MenuItemLink to="/settings/provider">
            <MenuItem className={isRoute('/settings/provider')}>
              <Cloud size={18} />
              {t('settings.provider.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/model">
            <MenuItem className={isRoute('/settings/model')}>
              <Package size={18} />
              {t('settings.model')}
            </MenuItem>
          </MenuItemLink>
          <Divider />
          <MenuItemLink to="/settings/general">
            <MenuItem className={isRoute('/settings/general')}>
              <Settings2 size={18} />
              {t('settings.general.label')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/display">
            <MenuItem className={isRoute('/settings/display')}>
              <MonitorCog size={18} />
              {t('settings.display.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/data">
            <MenuItem className={isRoute('/settings/data')}>
              <HardDrive size={18} />
              {t('settings.data.title')}
            </MenuItem>
          </MenuItemLink>
          <Divider />
          <MenuItemLink to="/settings/mcp">
            <MenuItem className={isRoute('/settings/mcp')}>
              <McpLogo width={18} height={18} style={{ opacity: 0.8 }} />
              {t('settings.mcp.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/skills">
            <MenuItem className={isRoute('/settings/skills')}>
              <Sparkles size={18} />
              {t('settings.skills.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/websearch">
            <MenuItem className={isRoute('/settings/websearch')}>
              <Search size={18} />
              {t('settings.tool.websearch.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/memory">
            <MenuItem className={isRoute('/settings/memory')}>
              <Brain size={18} />
              {t('memory.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/api-server">
            <MenuItem className={isRoute('/settings/api-server')}>
              <Server size={18} />
              {t('apiServer.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/channels">
            <MenuItem className={isRoute('/settings/channels')}>
              <Radio size={18} />
              {t('settings.channels.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/scheduled-tasks">
            <MenuItem className={isRoute('/settings/scheduled-tasks')}>
              <CalendarClock size={18} />
              {t('settings.scheduledTasks.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/docprocess">
            <MenuItem className={isRoute('/settings/docprocess')}>
              <FileCode size={18} />
              {t('settings.tool.preprocess.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/quickphrase">
            <MenuItem className={isRoute('/settings/quickphrase')}>
              <Zap size={18} />
              {t('settings.quickPhrase.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/shortcut">
            <MenuItem className={isRoute('/settings/shortcut')}>
              <Command size={18} />
              {t('settings.shortcuts.title')}
            </MenuItem>
          </MenuItemLink>
          <Divider />
          <MenuItemLink to="/settings/quickAssistant">
            <MenuItem className={isRoute('/settings/quickAssistant')}>
              <PictureInPicture2 size={18} />
              {t('settings.quickAssistant.title')}
            </MenuItem>
          </MenuItemLink>
          <MenuItemLink to="/settings/selectionAssistant">
            <MenuItem className={isRoute('/settings/selectionAssistant')}>
              <TextCursorInput size={18} />
              {t('selection.name')}
            </MenuItem>
          </MenuItemLink>
          <Divider />
          <MenuItemLink to="/settings/about">
            <MenuItem className={isRoute('/settings/about')}>
              <Info size={18} />
              {t('settings.about.label')}
            </MenuItem>
          </MenuItemLink>
        </SettingMenus>*/}
        <SettingContent>
          <Routes>
            <Route path="provider" element={<ProviderList />} />
            <Route path="model" element={<ModelSettings />} />
            <Route path="websearch/*" element={<WebSearchSettings />} />
            <Route path="api-server" element={<ApiServerSettings />} />
            <Route path="channels" element={<ChannelsSettings />} />
            <Route path="scheduled-tasks" element={<TasksSettings />} />
            <Route path="docprocess" element={<DocProcessSettings />} />
            <Route path="quickphrase" element={<QuickPhraseSettings />} />
            <Route path="mcp/*" element={<MCPSettings />} />
            <Route path="skills" element={<SkillsSettings />} />
            <Route path="memory" element={<MemorySettings />} />
            <Route path="general/*" element={<GeneralSettings />} />
            <Route path="display" element={<DisplaySettings />} />
            <Route path="shortcut" element={<ShortcutSettings />} />
            <Route path="quickAssistant" element={<QuickAssistantSettings />} />
            <Route path="selectionAssistant" element={<SelectionAssistantSettings />} />
            <Route path="data" element={<DataSettings />} />
            <Route path="about" element={<AboutSettings />} />
          </Routes>
        </SettingContent>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: calc(100vh - var(--navbar-height) - 10px);
  padding: 1px 0;
  gap: 10px;
`

const SettingMenus = styled(Scrollbar)`
  display: flex;
  flex-direction: column;
  min-width: var(--settings-width);
  //border-right: 0.5px solid var(--color-border);
  padding: 10px;
  user-select: none;
  gap: 8px;
  background-color: var(--color-background);
  border-radius: var(--base-border-radius);
  .group-item{
    .group-name{
      padding: 10px 5px;
      font-size: 12px;
      color: var(--color-text-3);
    }
    + .ant-divider{
      margin-block: 5px;
    }
  }
`

const MenuItemLink = styled(Link)`
  text-decoration: none;
  color: var(--color-text-1);
`

const MenuItem = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  width: 100%;
  cursor: pointer;
  border-radius: var(--list-item-border-radius);
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border: 0.5px solid transparent;
  .anticon {
    font-size: 16px;
    opacity: 0.8;
  }
  &:hover {
    background: var(--color-background-soft);
  }
  &.active {
    background: var(--color-list-item);
    color: var(--color-primary);
    //border: 0.5px solid var(--color-border);
  }
`

const SettingContent = styled.div`
  display: flex;
  height: 100%;
  flex: 1;
  border-radius: var(--base-border-radius);
  overflow: hidden;
`

const Divider = styled(AntDivider)`
  margin: 3px 0;
`

export default SettingsPage
