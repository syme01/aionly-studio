import { createRequire } from 'node:module'
import path from 'node:path'

import { toAsarUnpackedPath } from '.'

const require_ = createRequire(import.meta.url)

type LinuxLibc = 'glibc' | 'musl'
type BundledBinaryPlatform = 'darwin' | 'linux' | 'win32'

function assertSupportedTarget(
  binaryName: string,
  platform: NodeJS.Platform,
  arch: NodeJS.Architecture
): asserts platform is BundledBinaryPlatform {
  const supportedPlatform = platform === 'darwin' || platform === 'linux' || platform === 'win32'
  const supportedArchitecture = arch === 'arm64' || arch === 'x64'

  if (!supportedPlatform || !supportedArchitecture) {
    throw new Error(`Bundled ${binaryName} is not available for ${platform}-${arch}`)
  }
}

function detectLinuxLibc(): LinuxLibc {
  try {
    const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined
    return report?.header?.glibcVersionRuntime ? 'glibc' : 'musl'
  } catch {
    return 'musl'
  }
}

/**
 * Resolves the platform-specific Claude Code native binary.
 *
 * Since claude-agent-sdk 0.3.x the CLI ships as native binaries in
 * platform-specific optional dependency packages
 * (@anthropic-ai/claude-agent-sdk-win32-x64 etc.) instead of cli.js.
 */
export function resolveClaudeExecutablePath(): string {
  const sdkRequire = createRequire(require_.resolve('@anthropic-ai/claude-agent-sdk'))
  const platform = process.platform
  const arch = process.arch
  assertSupportedTarget('Claude Code native binary', platform, arch)
  const extension = platform === 'win32' ? '.exe' : ''

  const packageNames =
    platform === 'linux'
      ? (() => {
          const linuxLibc = detectLinuxLibc()
          const glibcPackage = `@anthropic-ai/claude-agent-sdk-linux-${arch}`
          const muslPackage = `${glibcPackage}-musl`
          return linuxLibc === 'glibc' ? [glibcPackage, muslPackage] : [muslPackage, glibcPackage]
        })()
      : [`@anthropic-ai/claude-agent-sdk-${platform}-${arch}`]

  for (const packageName of packageNames) {
    try {
      return toAsarUnpackedPath(sdkRequire.resolve(`${packageName}/claude${extension}`))
    } catch {
      // Optional native packages are platform-specific; try the next candidate.
    }
  }

  throw new Error(
    `Claude Code native binary not found for ${platform}-${arch}. ` +
      'Reinstall @anthropic-ai/claude-agent-sdk with optional dependencies.'
  )
}

/**
 * Resolves the bundled ripgrep binary (used by file search features).
 *
 * The SDK dropped its bundled vendor/ripgrep directory in 0.3.x, so ripgrep
 * now ships via the @cherrystudio/ripgrep package.
 */
export function resolveBundledRipgrepPath(): string {
  const platform = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'win32' : 'linux'
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const packageRoot = path.dirname(require_.resolve('@cherrystudio/ripgrep/package.json'))
  const executable = process.platform === 'win32' ? 'rg.exe' : 'rg'

  return toAsarUnpackedPath(path.join(packageRoot, 'vendor', 'ripgrep', `${arch}-${platform}`, executable))
}
