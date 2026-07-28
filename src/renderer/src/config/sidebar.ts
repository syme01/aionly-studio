import type { SidebarIcon } from '@renderer/types'

/**
 * 默认显示的侧边栏图标
 * 这些图标会在侧边栏中默认显示
 */
export const DEFAULT_SIDEBAR_ICONS: SidebarIcon[] = [
  'assistants',
  'agents',
  'store',
  'paintings',
  'translate',
  'minapp',
  'knowledge',
  'files',
  'code_tools',
  'notes'
  // 'openclaw'
]

/**
 * 必须显示的侧边栏图标（不能被隐藏）
 * 这些图标必须始终在侧边栏中可见
 * 抽取为参数方便未来扩展
 */
export const REQUIRED_SIDEBAR_ICONS: SidebarIcon[] = ['assistants', 'agents', 'paintings', 'translate', 'minapp']

/**
 * 必须显示的侧边栏图标（不能被隐藏）
 * TODO：暂时屏蔽知识库菜单，因为aionly平台暂时没有向量模型
 */
export const SHOW_IN_USER_MENUS = [
  {
    path: '/settings/provider',
    name: 'settings',
    icon: 'icon-shezhi'
  },
  /*{
    path: '/knowledge',
    name: 'knowledge',
    icon: 'icon-zhishiku'
  },*/
  {
    path: '/files',
    name: 'files',
    icon: 'icon-a-wenjianjiawenjian'
  },
  {
    path: '/notes',
    name: 'notes',
    icon: 'icon-a-bijibenbiji'
  },
  {
    path: '/identity',
    name: 'identity',
    icon: 'icon-qiehuanshenfen'
  },
  {
    path: '/logout',
    name: 'logout',
    icon: 'icon-tuichudenglu'
  }
]
