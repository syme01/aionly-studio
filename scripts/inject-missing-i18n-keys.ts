/**
 * This script injects missing i18n keys from the base locale into all other locale files.
 *
 * Injected values are prefixed with '[to be translated]' (the same marker used by
 * scripts/auto-translate-i18n.ts) and filled with the base locale text, so that a
 * subsequent `pnpm i18n:translate` run can translate them automatically.
 *
 * Existing keys are NEVER modified or removed — this script is additive only,
 * which makes it a safe alternative to `pnpm i18n:sync` (which deletes keys
 * that are missing from the base locale).
 *
 * Usage:
 *   pnpm i18n:inject
 */
import * as fs from 'fs'
import * as path from 'path'

import { sortedObjectByKeys } from './sort'

// ========== SCRIPT CONFIGURATION AREA - MODIFY SETTINGS HERE ==========
const SCRIPT_CONFIG = {
  // 🌍 Base locale: key source AND text source for injection
  BASE_LOCALE: process.env.TRANSLATION_BASE_LOCALE ?? 'en-us', // keep in sync with auto-translate-i18n.ts

  // 🚫 Skip specific languages, e.g.: ['de-de', 'el-gr']
  SKIP_LANGUAGES: [] as string[]
} as const
// ================================================================

const PREFIX = '[to be translated]'

type I18NValue = string | { [key: string]: I18NValue }
type I18N = { [key: string]: I18NValue }

const readJson = (filePath: string): I18N => JSON.parse(fs.readFileSync(filePath, 'utf-8'))

/**
 * Flatten a nested i18n object into a Map of dot-separated key paths -> leaf string values.
 * Non-string, non-object values are reported as unexpected edge cases.
 */
const flattenToStringEntries = (obj: I18N, prefix = ''): Map<string, string> => {
  const entries = new Map<string, string>()
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      entries.set(fullKey, value)
    } else if (typeof value === 'object' && value !== null) {
      for (const [nestedKey, nestedValue] of flattenToStringEntries(value as I18N, fullKey)) {
        entries.set(nestedKey, nestedValue)
      }
    } else {
      console.warn(`unexpected edge case: "${fullKey}" has type ${typeof value}, skipped`)
    }
  }
  return entries
}

/**
 * Check whether a dot-separated key path exists in a nested object.
 */
const hasNestedKey = (obj: I18N, keyPath: string): boolean => {
  const segments = keyPath.split('.')
  let current: I18NValue = obj
  for (const segment of segments) {
    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return false
    }
    current = (current as I18N)[segment]
  }
  return true
}

/**
 * Set a value at a dot-separated key path, creating intermediate objects as needed.
 * Returns false if an existing non-object value blocks the path.
 */
const setNestedKey = (obj: I18N, keyPath: string, value: string): boolean => {
  const segments = keyPath.split('.')
  let current: I18N = obj
  for (const segment of segments.slice(0, -1)) {
    const next = current[segment]
    if (typeof next === 'object' && next !== null) {
      current = next as I18N
    } else if (next === undefined) {
      const created: I18N = {}
      current[segment] = created
      current = created
    } else {
      // Type conflict: path is blocked by an existing string (or other primitive)
      return false
    }
  }
  const lastSegment = segments[segments.length - 1]
  const existing = current[lastSegment]
  if (typeof existing === 'object' && existing !== null) {
    // Type conflict: leaf position already holds an object
    return false
  }
  current[lastSegment] = value
  return true
}

const main = () => {
  const baseFileName = `${SCRIPT_CONFIG.BASE_LOCALE}.json`
  const localesDir = path.join(__dirname, '../src/renderer/src/i18n/locales')
  const translateDir = path.join(__dirname, '../src/renderer/src/i18n/translate')
  const baseLocalePath = path.join(localesDir, baseFileName)
  if (!fs.existsSync(baseLocalePath)) {
    throw new Error(`${baseLocalePath} not found.`)
  }

  const baseEntries = flattenToStringEntries(readJson(baseLocalePath))
  console.log(`📂 Base Locale: ${SCRIPT_CONFIG.BASE_LOCALE} (${baseEntries.size} keys)`)

  const getTargetFiles = (dir: string) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((file) => {
            const filename = file.replace('.json', '')
            return file.endsWith('.json') && file !== baseFileName && !SCRIPT_CONFIG.SKIP_LANGUAGES.includes(filename)
          })
          .map((filename) => path.join(dir, filename))
      : []

  const files = [...getTargetFiles(localesDir), ...getTargetFiles(translateDir)]
  if (files.length === 0) {
    console.log('No target files found, nothing to do.')
    return
  }

  let totalInjected = 0
  for (const filePath of files) {
    const filename = path.basename(filePath, '.json')
    const targetJson = readJson(filePath)
    const missing = [...baseEntries.entries()].filter(([key]) => !hasNestedKey(targetJson, key))

    if (missing.length === 0) {
      console.log(`✅ ${filename}: no missing keys`)
      continue
    }

    let injected = 0
    let failed = 0
    for (const [key, value] of missing) {
      if (setNestedKey(targetJson, key, `${PREFIX} ${value}`)) {
        injected += 1
      } else {
        failed += 1
        console.warn(`  ⚠️ Type conflict at "${key}" in ${filename}, skipped — needs manual fix`)
      }
    }

    const sortedResult = sortedObjectByKeys(targetJson)
    fs.writeFileSync(filePath, JSON.stringify(sortedResult, null, 2) + '\n', 'utf-8')
    console.log(`📝 ${filename}: injected ${injected} keys${failed > 0 ? `, ${failed} skipped` : ''}`)
    totalInjected += injected
  }

  console.log(`\n🎉 Done: ${totalInjected} keys injected in total.`)
  console.log('Next step: run `pnpm i18n:translate` to translate the injected keys.')
}

main()
