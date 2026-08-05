#!/usr/bin/env tsx
import fs from 'node:fs'
import path from 'node:path'

const flavor = process.argv[2]
if (!['cn', 'global'].includes(flavor)) {
  console.error('Usage: tsx scripts/switch-flavor.ts <cn|global>')
  process.exit(1)
}

const root = path.resolve(__dirname, '..')
const configDir = path.join(root, 'config', flavor)
const envOverridePath = path.join(configDir, '.env.override')

if (!fs.existsSync(envOverridePath)) {
  console.error(`Missing: ${envOverridePath}`)
  process.exit(1)
}

const overrides = fs.readFileSync(envOverridePath, 'utf-8')
const entries: [string, string][] = []

for (const line of overrides.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/)
  if (match) {
    entries.push([match[1].trim(), match[2].trim()])
  }
}

const get = (key: string) => entries.find(([k]) => k === key)?.[1] ?? ''

// Environment variables take precedence over .env.override
const getWithEnv = (key: string) => process.env[key] || get(key)

// 1. Apply VITE_* entries to .env.production
const envProdPath = path.join(root, '.env.production')
if (fs.existsSync(envProdPath)) {
  let envProd = fs.readFileSync(envProdPath, 'utf-8')

  // Environment-specific URLs (prioritize CI environment variables)
  const envVars = ['VITE_API_URL', 'VITE_USER_UI_HOST', 'VITE_WEB_UI_HOST']

  for (const key of envVars) {
    const value = getWithEnv(key)
    if (value) {
      if (new RegExp(`^${key}\\s*=`, 'm').test(envProd)) {
        envProd = envProd.replace(new RegExp(`^${key}\\s*=.*$`, 'm'), `${key} = ${value}`)
      } else {
        envProd += `\n${key} = ${value}`
      }
    }
  }

  // Other VITE_* variables from .env.override
  for (const [key, value] of entries) {
    if ((key.startsWith('VITE_') || key.startsWith('MAIN_VITE_')) && !envVars.includes(key)) {
      if (new RegExp(`^${key}\\s*=`, 'm').test(envProd)) {
        envProd = envProd.replace(new RegExp(`^${key}\\s*=.*$`, 'm'), `${key} = ${value}`)
      } else {
        envProd += `\n${key} = ${value}`
      }
    }
  }
  fs.writeFileSync(envProdPath, envProd)
  console.log(`✅ Applied env overrides to .env.production`)
}

// 2. Apply non-VITE entries to constant.ts
const constantPath = path.join(root, 'packages/shared/config/constant.ts')
if (fs.existsSync(constantPath)) {
  let constant = fs.readFileSync(constantPath, 'utf-8')

  // APP_API_HOST can be overridden by environment variable
  const appApiHost = getWithEnv('APP_API_HOST')
  if (appApiHost) {
    constant = constant.replace(new RegExp(`^(export const APP_API_HOST\\s*=\\s*).*$`, 'm'), `$1'${appApiHost}'`)
  }

  // Other non-VITE entries from .env.override
  for (const [key, value] of entries) {
    if (!key.startsWith('VITE_') && !key.startsWith('MAIN_VITE_') && key !== 'APP_API_HOST') {
      const isNumber = /^\d+$/.test(value)
      constant = constant.replace(
        new RegExp(`^(export const ${key}\\s*=\\s*).*$`, 'm'),
        isNumber ? `$1${value}` : `$1'${value}'`
      )
    }
  }
  fs.writeFileSync(constantPath, constant)
  console.log(`✅ Applied constant overrides to constant.ts`)
}

// 3. Update electron-builder.yml — identity fields + icon paths
const ymlPath = path.join(root, 'electron-builder.yml')
if (fs.existsSync(ymlPath)) {
  const appName = get('APP_NAME')
  const appProtocol = get('APP_PROTOCOL')
  const appBundleId = get('APP_BUNDLE_ID')

  let yml = fs.readFileSync(ymlPath, 'utf-8')

  // App identity
  yml = yml.replace(/^(appId:\s*).*$/m, `$1${appBundleId}`)
  yml = yml.replace(/^(productName:\s*).*$/m, `$1${appName}`)

  // executableName appears in both win and linux sections
  yml = yml.replace(/^(\s+executableName:\s*).*$/gm, `$1${appName}`)

  // Protocol handler
  yml = yml.replace(/^(  - name:\s*).*$/m, `$1${appName}`)
  yml = yml.replace(/^(      - )(aiionly|aionly)$/m, `$1${appProtocol}`)

  // Linux desktop entry
  yml = yml.replace(/^(\s+- x-scheme-handler\/).*$/m, `$1${appProtocol}`)
  yml = yml.replace(/^(\s+Name:\s*).*$/m, `$1${appName}`)
  yml = yml.replace(/^(\s+StartupWMClass:\s*).*$/m, `$1${appName}`)

  // Icon paths
  yml = yml
    .replace(/^(\s+icon:\s*)config\/[^/\s]+\/build\/icon\.ico$/m, `$1config/${flavor}/build/icon.ico`)
    .replace(/^(\s+icon:\s*)config\/[^/\s]+\/build\/icon\.icns$/m, `$1config/${flavor}/build/icon.icns`)
    .replace(/^(\s+icon:\s*)config\/[^/\s]+\/build\/icons$/m, `$1config/${flavor}/build/icons`)

  fs.writeFileSync(ymlPath, yml)
  console.log(`✅ Updated electron-builder.yml (identity + icons + installDirectory)`)
}

// 4. Copy logo to renderer assets
const logoSrc = path.join(configDir, 'build', 'logo.png')
const logoDst = path.join(root, 'src/renderer/src/assets/images/logo.png')
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, logoDst)
  console.log(`✅ Copied logo.png`)
}

// 5. Copy runtime icons to build/ (tray icons, window icon)
const runtimeIcons = ['icon.png', 'tray_icon.png', 'tray_icon_dark.png', 'tray_icon_light.png']
const buildDst = path.join(root, 'build')
for (const file of runtimeIcons) {
  const src = path.join(configDir, 'build', file)
  const dst = path.join(buildDst, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst)
  }
}
console.log(`✅ Copied runtime icons to build/`)

// 6. Update package.json name field to ensure full identity separation
const packageJsonPath = path.join(root, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const appName = get('APP_NAME')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  packageJson.name = appName
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  console.log(`✅ Updated package.json name to: ${appName}`)
}

console.log(`✅ Switched to flavor: ${flavor}`)
