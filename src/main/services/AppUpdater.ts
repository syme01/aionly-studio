import { loggerService } from '@logger'
import { isWin } from '@main/constant'
// import { getIpCountry } from '@main/utils/ipService'
import { generateUserAgent } from '@main/utils/systemInfo'
import { APP_NAME, UPDATE_API_BASE_URL, UPDATE_CHECK_PATH } from '@shared/config/constant'
import { IpcChannel } from '@shared/IpcChannel'
import type { UpdateInfo } from 'builder-util-runtime'
import { CancellationToken } from 'builder-util-runtime'
import { app, net, shell } from 'electron'
import type { AppUpdater as _AppUpdater, Logger, NsisUpdater, UpdateCheckResult } from 'electron-updater'
import { autoUpdater } from 'electron-updater'
import fs from 'fs'
import path from 'path'
import semver from 'semver'

import { analyticsService } from './AnalyticsService'
import { configManager } from './ConfigManager'
import { windowService } from './WindowService'

const logger = loggerService.withContext('AppUpdater')

function getCommonHeaders() {
  return {
    'User-Agent': generateUserAgent(),
    'Cache-Control': 'no-cache',
    'Client-Id': configManager.getClientId(),
    'App-Name': APP_NAME,
    'App-Version': `v${app.getVersion()}`,
    OS: process.platform
  }
}

// Language markers constants for multi-language release notes
const LANG_MARKERS = {
  EN_START: '<!--LANG:en-->',
  ZH_CN_START: '<!--LANG:zh-CN-->',
  END: '<!--LANG:END-->'
}

/*interface UpdateConfig {
  lastUpdated: string
  versions: {
    [versionKey: string]: VersionConfig
  }
}*/

/*interface VersionConfig {
  minCompatibleVersion: string
  description: string
  channels: {
    latest: ChannelConfig | null
    rc: ChannelConfig | null
    beta: ChannelConfig | null
  }
}*/

/*interface ChannelConfig {
  version: string
  feedUrls: Record<UpdateMirror, string>
}*/

export default class AppUpdater {
  autoUpdater: _AppUpdater = autoUpdater
  private cancellationToken: CancellationToken = new CancellationToken()
  private updateCheckResult: UpdateCheckResult | null = null
  private _downloadedInstallerPath: string | null = null

  constructor() {
    autoUpdater.logger = logger as Logger
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.autoDownload = configManager.getAutoUpdate()
    // Never auto-install on quit - user must explicitly click "Install Now"
    // Auto-install on quit can cause issues: unexpected updates on restart,
    // corruption if system shuts down during install, or app uninstall on force shutdown
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.requestHeaders = {
      ...autoUpdater.requestHeaders,
      ...getCommonHeaders()
    }

    autoUpdater.on('error', (error) => {
      logger.error('update error', error)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateError, error)
    })

    autoUpdater.on('update-available', (releaseInfo: UpdateInfo) => {
      logger.info('update available', releaseInfo)
      const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateAvailable, processedReleaseInfo)
    })

    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => {
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateNotAvailable)
    })

    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
      windowService.getMainWindow()?.webContents.send(IpcChannel.DownloadProgress, progress)
    })

    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', (releaseInfo: UpdateInfo) => {
      const processedReleaseInfo = this.processReleaseInfo(releaseInfo)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateDownloaded, processedReleaseInfo)
      logger.info('update downloaded', processedReleaseInfo)
    })

    if (isWin) {
      ;(autoUpdater as NsisUpdater).installDirectory = path.dirname(app.getPath('exe'))
    }

    this.autoUpdater = autoUpdater
  }

  public setAutoUpdate(isActive: boolean) {
    autoUpdater.autoDownload = isActive
    // autoInstallOnAppQuit is always false - user must explicitly click "Install Now"
  }

  /*private _getChannelByVersion(version: string) {
    if (version.includes(`-${UpgradeChannel.BETA}.`)) {
      return UpgradeChannel.BETA
    }
    if (version.includes(`-${UpgradeChannel.RC}.`)) {
      return UpgradeChannel.RC
    }
    return UpgradeChannel.LATEST
  }*/

  /*private _getTestChannel() {
    const currentChannel = this._getChannelByVersion(app.getVersion())
    const savedChannel = configManager.getTestChannel()

    if (currentChannel === UpgradeChannel.LATEST) {
      return savedChannel || UpgradeChannel.RC
    }

    if (savedChannel === currentChannel) {
      return savedChannel
    }

    // if the upgrade channel is not equal to the current channel, use the latest channel
    return UpgradeChannel.LATEST
  }*/

  /**
   * Fetch update configuration from GitHub or GitCode based on mirror
   * @param mirror - Mirror to fetch config from
   * @returns UpdateConfig object or null if fetch fails
   */
  /*private async _fetchUpdateConfig(mirror: UpdateMirror): Promise<UpdateConfig | null> {
    const configUrl = mirror === UpdateMirror.GITCODE ? UpdateConfigUrl.GITCODE : UpdateConfigUrl.GITHUB

    try {
      logger.info(`Fetching update config from ${configUrl} (mirror: ${mirror})`)
      const response = await net.fetch(configUrl, {
        headers: {
          ...getCommonHeaders(),
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const config = (await response.json()) as UpdateConfig
      logger.info(`Update config fetched successfully, last updated: ${config.lastUpdated}`)
      return config
    } catch (error) {
      logger.error('Failed to fetch update config:', error as Error)
      return null
    }
  }*/

  /**
   * Find compatible channel configuration based on current version
   * @param currentVersion - Current app version
   * @param requestedChannel - Requested upgrade channel (latest/rc/beta)
   * @param config - Update configuration object
   * @returns Object containing ChannelConfig and actual channel if found, null otherwise
   */
  /*private _findCompatibleChannel(
    currentVersion: string,
    requestedChannel: UpgradeChannel,
    config: UpdateConfig
  ): { config: ChannelConfig; channel: UpgradeChannel } | null {
    // Get all version keys and sort descending (newest first)
    const versionKeys = Object.keys(config.versions).sort(semver.rcompare)

    logger.info(
      `Finding compatible channel for version ${currentVersion}, requested channel: ${requestedChannel}, available versions: ${versionKeys.join(', ')}`
    )

    for (const versionKey of versionKeys) {
      const versionConfig = config.versions[versionKey]
      const channelConfig = versionConfig.channels[requestedChannel]
      const latestChannelConfig = versionConfig.channels[UpgradeChannel.LATEST]

      if (!semver.gte(currentVersion, versionConfig.minCompatibleVersion)) {
        continue
      }

      // Check version compatibility and channel availability
      if (channelConfig !== null) {
        logger.info(
          `Found compatible version: ${versionKey} (minCompatibleVersion: ${versionConfig.minCompatibleVersion}), version: ${channelConfig.version}`
        )

        if (
          requestedChannel !== UpgradeChannel.LATEST &&
          latestChannelConfig &&
          semver.gte(latestChannelConfig.version, channelConfig.version)
        ) {
          logger.info(
            `latest channel version is greater than the requested channel version: ${latestChannelConfig.version} > ${channelConfig.version}, using latest instead`
          )
          return { config: latestChannelConfig, channel: UpgradeChannel.LATEST }
        }

        return { config: channelConfig, channel: requestedChannel }
      } else if (requestedChannel !== UpgradeChannel.LATEST && latestChannelConfig !== null) {
        // Fallback: requested channel (rc/beta) is null, but latest channel is available
        logger.info(
          `Requested channel ${requestedChannel} is null for ${versionKey}, falling back to latest channel: ${latestChannelConfig.version}`
        )
        return { config: latestChannelConfig, channel: UpgradeChannel.LATEST }
      }
    }

    logger.warn(`No compatible channel found for version ${currentVersion} and channel ${requestedChannel}`)
    return null
  }*/

  /*private _setChannel(channel: UpgradeChannel, feedUrl: string) {
    this.autoUpdater.channel = channel
    this.autoUpdater.setFeedURL(feedUrl)

    // disable downgrade after change the channel
    this.autoUpdater.allowDowngrade = false
    // github and gitcode don't support multiple range download
    this.autoUpdater.disableDifferentialDownload = true
  }*/

  /*private async _setFeedUrl() {
    const currentVersion = app.getVersion()
    const testPlan = configManager.getTestPlan()
    const requestedChannel = testPlan ? this._getTestChannel() : UpgradeChannel.LATEST

    // Determine mirror based on IP country
    const ipCountry = await getIpCountry()
    const mirror = ipCountry.toLowerCase() === 'cn' ? UpdateMirror.GITCODE : UpdateMirror.GITHUB

    logger.info(
      `Setting feed URL for version ${currentVersion}, testPlan: ${testPlan}, requested channel: ${requestedChannel}, mirror: ${mirror} (IP country: ${ipCountry})`
    )

    // Try to fetch update config from remote
    const config = await this._fetchUpdateConfig(mirror)

    if (config) {
      // Use new config-based system
      const result = this._findCompatibleChannel(currentVersion, requestedChannel, config)

      if (result) {
        const { config: channelConfig, channel: actualChannel } = result
        const feedUrl = channelConfig.feedUrls[mirror]
        logger.info(
          `Using config-based feed URL: ${feedUrl} for channel ${actualChannel} (requested: ${requestedChannel}, mirror: ${mirror})`
        )
        this._setChannel(actualChannel, feedUrl)
        return
      }
    }

    logger.info('Failed to fetch update config, falling back to default feed URL')
    // Fallback: use default feed URL based on mirror
    const defaultFeedUrl = mirror === UpdateMirror.GITCODE ? FeedUrl.PRODUCTION : FeedUrl.GITHUB_LATEST

    logger.info(`Using fallback feed URL: ${defaultFeedUrl}`)
    this._setChannel(UpgradeChannel.LATEST, defaultFeedUrl)
  }*/

  public cancelDownload() {
    this.cancellationToken.cancel()
    this.cancellationToken = new CancellationToken()
    if (this.autoUpdater.autoDownload) {
      this.updateCheckResult?.cancellationToken?.cancel()
    }
  }

  // ============ Custom Download Method ============
  private async _downloadInstaller(url: string, version: string): Promise<string> {
    const fileName = path.basename(new URL(url).pathname)
    const downloadDir = path.join(app.getPath('temp'), 'updates')

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    const filePath = path.join(downloadDir, fileName)
    logger.info(`Downloading update from ${url} to ${filePath} ${version}`)

    return new Promise((resolve, reject) => {
      const request = net.request({
        url,
        method: 'GET'
      })

      let totalBytes = 0
      let downloadedBytes = 0
      let lastProgressUpdate = 0
      const PROGRESS_THROTTLE_MS = 100 // 限制进度更新频率为每100ms一次
      const writeStream = fs.createWriteStream(filePath)

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`))
          return
        }

        const contentLength = response.headers['content-length']
        if (contentLength && typeof contentLength === 'string') {
          totalBytes = parseInt(contentLength, 10)
        }

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length
          writeStream.write(chunk)

          // 节流：只在时间间隔超过阈值时更新进度
          const now = Date.now()
          if (totalBytes > 0 && now - lastProgressUpdate >= PROGRESS_THROTTLE_MS) {
            lastProgressUpdate = now
            const percent = Math.round((downloadedBytes / totalBytes) * 100)
            windowService.getMainWindow()?.webContents.send(IpcChannel.DownloadProgress, {
              percent,
              bytesPerSecond: 0,
              total: totalBytes,
              transferred: downloadedBytes
            })
          }
        })

        response.on('end', () => {
          writeStream.end()
          // 确保最后发送100%的进度
          if (totalBytes > 0) {
            windowService.getMainWindow()?.webContents.send(IpcChannel.DownloadProgress, {
              percent: 100,
              bytesPerSecond: 0,
              total: totalBytes,
              transferred: downloadedBytes
            })
          }
          logger.info(`Download completed: ${filePath}`)
          resolve(filePath)
        })

        response.on('error', (error) => {
          writeStream.end()
          reject(error)
        })
      })

      request.on('error', (error) => {
        writeStream.end()
        reject(error)
      })

      request.end()
    })
  }

  public async checkForUpdates() {
    void analyticsService.trackAppUpdate()

    if (isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env) {
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }

    try {
      // ============ Custom Update API ============
      const currentVersion = app.getVersion()
      const platform = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'MacOS' : 'Linux'
      const url = `${UPDATE_API_BASE_URL}${UPDATE_CHECK_PATH}/${platform}?arch=${process.arch}`

      logger.info(`Checking custom update from ${url}, current version: ${currentVersion}, arch: ${process.arch}`)

      const response = await net.fetch(url, {
        headers: {
          ...getCommonHeaders(),
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info('Custom update API response:', result)

      if (result.code != 200 || !result.data) {
        // throw new Error(`API error: ${result.msg || ''}`)
        // TODO: 提示信息暂空，理应由后端返回
        throw new Error(`API error: result.data is null`)
      }

      const latestVersion = result.data?.version
      const hasUpdate = latestVersion && semver.gt(latestVersion, currentVersion)

      if (hasUpdate) {
        const updateInfo: UpdateInfo = {
          version: latestVersion,
          releaseNotes: result.data?.notes || '',
          releaseName: `v${latestVersion}`,
          releaseDate: result.data?.releaseTime || new Date().toISOString(),
          path: result.data?.ossUrl || '',
          sha512: result.data?.sha512 || '',
          files: []
        }

        // 通知前端有新版本
        windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateAvailable, updateInfo)

        if (!result.data?.ossId) {
          throw new Error('ossId is missing')
        }

        // 延迟启动下载，给 UI 时间更新状态，避免卡顿
        setTimeout(() => {
          // const downloadUrl = `${UPDATE_API_BASE_URL}/${UPDATE_DOWNLOAD_API_BASE_URL}/${result.data.ossId}`
          void this._downloadInstaller(result.data.ossUrl, latestVersion)
            .then((filePath) => {
              this._downloadedInstallerPath = filePath
              windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateDownloaded, updateInfo)
              logger.info(`Installer ready at: ${filePath}`)
            })
            .catch((error) => {
              logger.error('Failed to download installer:', error as Error)
              windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateError, error)
            })
        }, 200) // 200ms 延迟足够让 UI 完成状态更新

        return {
          currentVersion,
          updateInfo
        }
      } else {
        // 无可用更新
        windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateNotAvailable)
        return {
          currentVersion,
          updateInfo: null
        }
      }

      // ============ Legacy Update Logic (Deprecated) ============
      /*
      await this._setFeedUrl()

      this.updateCheckResult = await this.autoUpdater.checkForUpdates()
      logger.info(
        `update check result: ${this.updateCheckResult?.isUpdateAvailable}, channel: ${this.autoUpdater.channel}, currentVersion: ${this.autoUpdater.currentVersion}`
      )

      if (this.updateCheckResult?.isUpdateAvailable && !this.autoUpdater.autoDownload) {
        logger.info('downloadUpdate manual by check for updates', this.cancellationToken)
        void this.autoUpdater.downloadUpdate(this.cancellationToken)
      }

      return {
        currentVersion: this.autoUpdater.currentVersion,
        updateInfo: this.updateCheckResult?.isUpdateAvailable ? this.updateCheckResult?.updateInfo : null
      }
      */
    } catch (error) {
      logger.error('Failed to check for update:', error as Error)
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateError, error)
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }
  }

  public quitAndInstall() {
    // ============ Custom Installer Launch ============
    if (this._downloadedInstallerPath && fs.existsSync(this._downloadedInstallerPath)) {
      logger.info(`Launching installer: ${this._downloadedInstallerPath}`)
      shell
        .openPath(this._downloadedInstallerPath)
        .then(() => {
          app.isQuitting = true
          app.quit()
        })
        .catch((error) => {
          logger.error('Failed to open installer:', error)
          windowService
            .getMainWindow()
            ?.webContents.send(IpcChannel.UpdateError, new Error('Failed to launch installer'))
        })
    } else {
      logger.error('Installer not found, cannot install update')
      windowService.getMainWindow()?.webContents.send(IpcChannel.UpdateError, new Error('Installer file not found'))
    }

    // ============ Legacy autoUpdater quitAndInstall (Deprecated) ============
    // app.isQuitting = true
    // setImmediate(() => autoUpdater.quitAndInstall(true, true))
  }

  /**
   * Check if release notes contain multi-language markers
   */
  private hasMultiLanguageMarkers(releaseNotes: string): boolean {
    return releaseNotes.includes(LANG_MARKERS.EN_START)
  }

  /**
   * Parse multi-language release notes and return the appropriate language version
   * @param releaseNotes - Release notes string with language markers
   * @returns Parsed release notes for the user's language
   *
   * Expected format:
   * <!--LANG:en-->English content<!--LANG:zh-CN-->Chinese content<!--LANG:END-->
   */
  private parseMultiLangReleaseNotes(releaseNotes: string): string {
    try {
      const language = configManager.getLanguage()
      const isChineseUser = language === 'zh-CN' || language === 'zh-TW'

      // Create regex patterns using constants
      const enPattern = new RegExp(
        `${LANG_MARKERS.EN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${LANG_MARKERS.ZH_CN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      )
      const zhPattern = new RegExp(
        `${LANG_MARKERS.ZH_CN_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${LANG_MARKERS.END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      )

      // Extract language sections
      const enMatch = releaseNotes.match(enPattern)
      const zhMatch = releaseNotes.match(zhPattern)

      // Return appropriate language version with proper fallback
      if (isChineseUser && zhMatch) {
        return zhMatch[1].trim()
      } else if (enMatch) {
        return enMatch[1].trim()
      } else {
        // Clean fallback: remove all language markers
        logger.warn('Failed to extract language-specific release notes, using cleaned fallback')
        return releaseNotes
          .replace(new RegExp(`${LANG_MARKERS.EN_START}|${LANG_MARKERS.ZH_CN_START}|${LANG_MARKERS.END}`, 'g'), '')
          .trim()
      }
    } catch (error) {
      logger.error('Failed to parse multi-language release notes', error as Error)
      // Return original notes as safe fallback
      return releaseNotes
    }
  }

  /**
   * Process release info to handle multi-language release notes
   * @param releaseInfo - Original release info from updater
   * @returns Processed release info with localized release notes
   */
  private processReleaseInfo(releaseInfo: UpdateInfo): UpdateInfo {
    const processedInfo = { ...releaseInfo }

    // Handle multi-language release notes in string format
    if (releaseInfo.releaseNotes && typeof releaseInfo.releaseNotes === 'string') {
      // Check if it contains multi-language markers
      if (this.hasMultiLanguageMarkers(releaseInfo.releaseNotes)) {
        processedInfo.releaseNotes = this.parseMultiLangReleaseNotes(releaseInfo.releaseNotes)
      }
    }

    return processedInfo
  }
}
