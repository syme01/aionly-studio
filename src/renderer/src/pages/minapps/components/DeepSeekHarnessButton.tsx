import { loggerService } from '@logger'
import deepseekLogo from '@renderer/assets/images/providers/deepseek.png'
import MinAppIcon from '@renderer/components/Icons/MinAppIcon'
import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
import type { MinAppType } from '@renderer/types'
import { codeTools, DSH_WEB_DEFAULTS } from '@shared/config/constant'
import { Spin } from 'antd'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const logger = loggerService.withContext('DeepSeekHarnessButton')

const DEEPSEEK_HARNESS_APP: MinAppType = {
  id: 'deepseek-harness',
  name: 'DeepSeek Harness',
  logo: deepseekLogo,
  url: `http://${DSH_WEB_DEFAULTS.HOST}:${DSH_WEB_DEFAULTS.PORT}`, // dsh web 默认地址，实际以启动后返回的 url 为准
  bodered: true,
  style: { borderRadius: 10 }
}

/**
 * 小程序页固定的 DeepSeek Harness 入口：
 * - 已安装：启动 `dsh web`（已在运行则复用），以小程序 webview 方式打开 Web UI
 * - 未安装：自动安装（必要时先安装 bun），安装完成后同样启动并以 webview 打开
 */
const DeepSeekHarnessButton: FC = () => {
  const { t } = useTranslation()
  const { openSmartMinapp } = useMinappPopup()
  const [busy, setBusy] = useState(false)

  const handleClick = useCallback(async () => {
    if (busy) return

    try {
      const installed = await window.api.codeTools.isInstalled(codeTools.deepseekHarness)
      if (!installed) {
        // dsh 通过 bun 全局安装，先确保 bun 可用
        const bunExists = await window.api.isBinaryExist('bun')
        if (!bunExists) {
          await window.api.installBunBinary()
        }

        setBusy(true)
        window.toast.info(t('minapp.deepseek_harness.installing'))

        const result = await window.api.codeTools.install(codeTools.deepseekHarness)
        if (!result.success) {
          window.toast.error(`${t('minapp.deepseek_harness.install_failed')}: ${result.message}`)
          return
        }
        window.toast.success(t('minapp.deepseek_harness.install_success'))
      }

      // window.toast.info(t('minapp.deepseek_harness.starting'))
      const startResult = await window.api.codeTools.startDeepSeekHarness()
      if (startResult.success && startResult.url) {
        // 以小程序 webview 方式打开（自动适配顶部导航/侧边栏布局，与其他小程序一致）
        openSmartMinapp({ ...DEEPSEEK_HARNESS_APP, url: startResult.url }, true)
      } else {
        window.toast.error(`${t('minapp.deepseek_harness.start_failed')}: ${startResult.message}`)
      }
    } catch (error) {
      logger.error('Failed to launch DeepSeek Harness:', error as Error)
      window.toast.error(`${t('minapp.deepseek_harness.start_failed')}: ${(error as Error).message}`)
    } finally {
      setBusy(false)
    }
  }, [busy, t, openSmartMinapp])

  return (
    <Container onClick={handleClick}>
      <IconContainer>
        <MinAppIcon size={60} app={DEEPSEEK_HARNESS_APP} />
        {busy && (
          <SpinOverlay>
            <Spin size="small" />
          </SpinOverlay>
        )}
      </IconContainer>
      <AppTitle>DeepSeek Harness</AppTitle>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  min-height: 85px;
`

const IconContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--base-border-radius);
`

const SpinOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: inherit;
  background-color: var(--color-background-mute, rgba(0, 0, 0, 0.4));
`

const AppTitle = styled.div`
  font-size: 12px;
  margin-top: 5px;
  color: var(--color-text-soft);
  text-align: center;
  user-select: none;
  width: 100%;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
`

export default DeepSeekHarnessButton
