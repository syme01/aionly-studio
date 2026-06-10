#!/usr/bin/env tsx
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const constantFile = fs.readFileSync(path.join(root, 'packages/shared/config/constant.ts'), 'utf-8')

const extract = (name: string) => constantFile.match(new RegExp(`${name} = ['"]([^'"]+)['"]`))?.[1]

const APP_NAME = extract('APP_NAME')!
const APP_VERSION = extract('APP_VERSION')!
const APP_PROTOCOL = extract('APP_PROTOCOL')!
const APP_BUNDLE_ID = extract('APP_BUNDLE_ID')!

// Update electron-builder.yml
const ymlPath = path.join(root, 'electron-builder.yml')
let yml = fs.readFileSync(ymlPath, 'utf-8')
yml = yml
  .replace(/^appId:.*$/m, `appId: ${APP_BUNDLE_ID}`)
  .replace(/^productName:.*$/m, `productName: ${APP_NAME}`)
  .replace(/^\s+- name:.*$/m, `  - name: ${APP_NAME}`)
  .replace(/^\s+- cherrystudio$/m, `      - ${APP_PROTOCOL}`)
fs.writeFileSync(ymlPath, yml)

// Update package.json
const pkgPath = path.join(root, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
pkg.name = APP_NAME
pkg.version = APP_VERSION
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`✅ Synced: ${APP_NAME} v${APP_VERSION} | ${APP_PROTOCOL} | ${APP_BUNDLE_ID}`)
