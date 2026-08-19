#!/usr/bin/env tsx
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const constantFile = fs.readFileSync(path.join(root, 'packages/shared/config/constant.ts'), 'utf-8')

const extract = (name: string) => constantFile.match(new RegExp(`${name} = ['"]([^'"]+)['"]`))?.[1]

const APP_NAME = extract('APP_NAME')!
const APP_PROTOCOL = extract('APP_PROTOCOL')!
const APP_BUNDLE_ID = extract('APP_BUNDLE_ID')!

// Extract USER_UI_HOST and WEB_UI_HOST (template literals, need special handling)
const USER_UI_HOST_MATCH = constantFile.match(/USER_UI_HOST = `https:\/\/maas\.\$\{APP_PROTOCOL\}\.com`/)
const USER_UI_HOST = USER_UI_HOST_MATCH ? `https://maas.${APP_PROTOCOL}.com` : null

const WEB_UI_HOST_MATCH = constantFile.match(/WEB_UI_HOST = `https:\/\/\$\{APP_PROTOCOL\}\.com`/)
const WEB_UI_HOST = WEB_UI_HOST_MATCH ? `https://${APP_PROTOCOL}.com` : null

// Update electron-builder.yml
const ymlPath = path.join(root, 'electron-builder.yml')
let yml = fs.readFileSync(ymlPath, 'utf-8')
yml = yml
  .replace(/^appId:.*$/m, `appId: ${APP_BUNDLE_ID}`)
  .replace(/^productName:.*$/m, `productName: ${APP_NAME}`)
  .replace(/^\s+- name:.*$/m, `  - name: ${APP_NAME}`)
  .replace(/^\s+- cherrystudio$/m, `      - ${APP_PROTOCOL}`)
  .replace(/^(\s+executableName:).*$/gm, `$1 ${APP_NAME}`)
fs.writeFileSync(ymlPath, yml)

// Update src/renderer/index.html
const indexHtmlPath = path.join(root, 'src/renderer/index.html')
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')
indexHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${APP_NAME}</title>`)
fs.writeFileSync(indexHtmlPath, indexHtml)

// Update src/renderer/miniWindow.html
const miniWindowHtmlPath = path.join(root, 'src/renderer/miniWindow.html')
let miniWindowHtml = fs.readFileSync(miniWindowHtmlPath, 'utf-8')
miniWindowHtml = miniWindowHtml.replace(/<title>.*?<\/title>/, `<title>${APP_NAME} Quick Assistant</title>`)
fs.writeFileSync(miniWindowHtmlPath, miniWindowHtml)

// Update src/main/services/WindowService.ts
const windowServicePath = path.join(root, 'src/main/services/WindowService.ts')
let windowService = fs.readFileSync(windowServicePath, 'utf-8')
windowService = windowService.replace(/title: ['"].*?['"],/, `title: '${APP_NAME} Quick Assistant',`)
fs.writeFileSync(windowServicePath, windowService)

// Update src/main/services/TrayService.ts
const trayServicePath = path.join(root, 'src/main/services/TrayService.ts')
let trayService = fs.readFileSync(trayServicePath, 'utf-8')
trayService = trayService.replace(/setToolTip\(['"].*?['"]\)/, `setToolTip('${APP_NAME}')`)
fs.writeFileSync(trayServicePath, trayService)

// Update SKILL.md
const skillMdPath = path.join(
  root,
  'resources/builtin-agents/aionly-assistant/.claude/skills/aionly-assistant-guide/SKILL.md'
)
if (fs.existsSync(skillMdPath) && USER_UI_HOST && WEB_UI_HOST) {
  let skillMd = fs.readFileSync(skillMdPath, 'utf-8')

  // Replace cherry-studio with APP_PROTOCOL in data backup paths
  skillMd = skillMd.replace(/cherry-studio/g, APP_PROTOCOL)

  // Replace CherryStudio with APP_NAME in log paths
  skillMd = skillMd.replace(/CherryStudio/g, APP_NAME)

  // Replace Bug submission URL
  const bugUrl = `${USER_UI_HOST}/myOrder?from=${USER_UI_HOST}`
  skillMd = skillMd.replace(/\*\*Bug\/需求提交\*\*\(推荐\): https:\/\/[^\s]+/, `**Bug/需求提交**(推荐): ${bugUrl}`)

  // Replace official website and documentation URLs
  const webDomain = WEB_UI_HOST.replace('https://', '')
  const docUrl = `${USER_UI_HOST}/document/1930518409270280194`
  skillMd = skillMd.replace(/\*\*官网\*\*: [^\s]+ \| 中文文档 [^\s]+/, `**官网**: ${webDomain} | 中文文档 ${docUrl}`)

  fs.writeFileSync(skillMdPath, skillMd)
  console.log(`✅ Updated SKILL.md with ${APP_PROTOCOL} protocol and ${USER_UI_HOST} host`)
}

console.log(`✅ Synced: ${APP_NAME} | ${APP_PROTOCOL} | ${APP_BUNDLE_ID}`)
