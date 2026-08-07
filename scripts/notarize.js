require('dotenv').config()
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${context.appOutDir}/${appName}.app`

  // 优先使用 Keychain Profile 方案（推荐）
  if (process.env.APPLE_KEYCHAIN_PROFILE) {
    console.log('  • Using notarytool with keychain profile:', process.env.APPLE_KEYCHAIN_PROFILE)
    await notarize({
      appPath,
      appBundleId: context.packager.appInfo.id,
      tool: 'notarytool',
      keychainProfile: process.env.APPLE_KEYCHAIN_PROFILE,
      teamId: process.env.APPLE_TEAM_ID
    })
    console.log('  • Notarized app:', appPath)
    return
  }

  // 回退到旧方案（环境变量方式）
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('  • Skipping notarization: missing credentials')
    return
  }

  console.log('  • Using notarytool with environment variables (legacy)')
  await notarize({
    appPath,
    appBundleId: context.packager.appInfo.id,
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })

  console.log('  • Notarized app:', appPath)
}
