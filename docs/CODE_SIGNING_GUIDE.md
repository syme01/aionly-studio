# 代码签名配置指南

本文档详细说明如何为 AiOnly Studio 配置 macOS 和 Windows 平台的代码签名。

---

## 📋 目录

- [macOS 签名配置](#macos-签名配置)
  - [前置准备](#macos-前置准备)
  - [本地开发签名](#macos-本地开发签名)
  - [CI/CD 自动签名](#macos-cicd-自动签名)
- [Windows 签名配置](#windows-签名配置)
  - [前置准备](#windows-前置准备)
  - [本地开发签名](#windows-本地开发签名)
  - [CI/CD 自动签名](#windows-cicd-自动签名)
- [常见问题](#常见问题)
- [验证签名](#验证签名)

---

## macOS 签名配置

### macOS 前置准备

#### 1. 检查现有证书

如果你已有 `.p12` 或 `.pem` 证书文件，跳到步骤 3。

如果你只有 `.cer` 文件（公钥证书），需要导出包含私钥的完整证书：

```bash
# 1. 双击 .cer 文件导入到钥匙串
open developerID_application.cer

# 2. 检查是否包含私钥
security find-identity -v -p codesigning
```

**预期输出：**
```
1) ABCDEF1234567890 "Developer ID Application: Your Name (TEAM_ID)"
   1 valid identities found
```

#### 2. 导出 P12 证书（如果需要）

**方法 A：通过钥匙串应用**

1. 打开"钥匙串访问"应用
2. 在左侧选择"登录" → "我的证书"
3. 找到 "Developer ID Application: ..." 证书
4. 右键 → "导出..."
5. 文件格式选择 **".p12"**
6. 设置一个密码（记住这个密码！）
7. 保存为 `developerID_application.p12`

**方法 B：通过命令行**

```bash
# 导出为 .p12（需要输入钥匙串密码和设置新密码）
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -P "your-new-password" \
  -o developerID_application.p12
```

#### 3. 验证 P12 文件

```bash
# 检查 P12 文件是否有效
openssl pkcs12 -info -in developerID_application.p12 -noout
# 输入密码后，应显示证书信息
```

---

### macOS 本地开发签名

#### 方法 1：使用证书名称（推荐）

```bash
# 查找证书名称
security find-identity -v -p codesigning

# 设置环境变量
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# 构建并签名
pnpm build:mac

# 验证签名
codesign -dv --verbose=4 "dist/mac-arm64/AiOnly.app"
```

#### 方法 2：使用 P12 文件

```bash
# 设置环境变量
export CSC_LINK="/完整路径/to/developerID_application.p12"
export CSC_KEY_PASSWORD="your-p12-password"

# 构建并签名
pnpm build:mac
```

---

### macOS CI/CD 自动签名

#### 步骤 1：转换 P12 为 Base64

**在 macOS/Linux 上：**

```bash
# 转换为 base64
base64 -i developerID_application.p12 -o certificate.base64.txt

# 复制到剪贴板
cat certificate.base64.txt | pbcopy
```

**在 Windows 上（使用 PowerShell）：**

```powershell
# 打开 PowerShell，运行以下命令（替换为实际路径）
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\developerID_application.p12")) | Set-Clipboard

# base64 字符串已复制到剪贴板
```

**在 Windows 上（使用 Git Bash）：**

```bash
# 如果安装了 Git for Windows
base64 developerID_application.p12 > certificate.base64.txt
cat certificate.base64.txt
# 手动复制输出内容
```

#### 步骤 2：添加 GitHub Secrets

访问仓库设置页面：
```
https://github.com/你的用户名/aionly-studio/settings/secrets/actions
```

点击 **"New repository secret"**，添加以下 secrets：

| Secret Name | Value | 说明 |
|-------------|-------|------|
| `CSC_LINK` | 步骤 1 生成的 base64 字符串 | P12 证书的 base64 编码 |
| `CSC_KEY_PASSWORD` | P12 文件的密码 | 用于解密证书 |

**⚠️ 注意：** 
- 如果无法获取 Apple 专用密码，**暂时不需要**添加 `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID`
- 这样只会进行代码签名，不会进行公证（notarization）

#### 步骤 3：修改 GitHub Actions 配置

编辑文件：`.github/workflows/release.yml`

找到 **"Build Mac"** 步骤（约第 177 行），修改为：

```yaml
      - name: Build Mac
        if: matrix.os == 'macos-latest'
        run: |
          sudo -H pip install setuptools
          pnpm build:mac
        env:
          # macOS 代码签名配置（不含公证）
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_OPTIONS: --max-old-space-size=8192
          MAIN_VITE_MARKETAPI_CLIENT_SECRET: ${{ secrets.MAIN_VITE_MARKETAPI_CLIENT_SECRET }}
          MAIN_VITE_MINERU_API_KEY: ${{ secrets.MAIN_VITE_MINERU_API_KEY }}
          RENDERER_VITE_AIHUBMIX_SECRET: ${{ secrets.RENDERER_VITE_AIHUBMIX_SECRET }}
          RENDERER_VITE_PPIO_APP_SECRET: ${{ secrets.RENDERER_VITE_PPIO_APP_SECRET }}
          VITE_API_URL: ${{ vars.VITE_API_URL }}
          VITE_USER_UI_HOST: ${{ vars.VITE_USER_UI_HOST }}
          VITE_WEB_UI_HOST: ${{ vars.VITE_WEB_UI_HOST }}
          VITE_APP_API_HOST: ${{ vars.VITE_APP_API_HOST }}
```

**删除以下行：**
```yaml
CSC_IDENTITY_AUTO_DISCOVERY: false
```

#### 步骤 4：确认 electron-builder 配置

确认 `electron-builder.yml` 中的配置（第 104-107 行）：

```yaml
mac:
  icon: config/global/build/icon.icns
  entitlementsInherit: build/entitlements.mac.plist
  notarize: false  # 暂时禁用公证
```

#### 步骤 5：提交并触发构建

```bash
# 提交更改
git add .github/workflows/release.yml
git commit -m "feat: 启用 macOS 代码签名"
git push

# 创建并推送 tag 触发 release
git tag v1.0.0
git push origin v1.0.0
```

---

## Windows 签名配置

### Windows 前置准备

#### 1. 获取代码签名证书

**选项 A：购买商业证书（推荐用于生产环境）**

推荐供应商：
- [DigiCert](https://www.digicert.com/signing/code-signing-certificates)
- [Sectigo (原 Comodo)](https://sectigo.com/ssl-certificates-tls/code-signing)
- [GlobalSign](https://www.globalsign.com/en/code-signing-certificate)

证书类型：
- **EV Code Signing**：最高信任级别，立即受信任，价格较高
- **Standard Code Signing**：标准级别，需要积累信誉

**选项 B：自签名证书（仅用于测试）**

⚠️ 用户会看到"未知发布者"警告

```powershell
# 创建自签名证书
New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=YourCompany, O=YourCompany, C=CN" `
  -KeyUsage DigitalSignature `
  -FriendlyName "Code Signing Certificate" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")

# 导出为 .pfx
$cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | Select-Object -First 1
$certPassword = ConvertTo-SecureString -String "your-password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath ".\codesign.pfx" -Password $certPassword
```

#### 2. 安装证书到系统

**从 .pfx 文件安装：**

1. 双击 `.pfx` 文件
2. 选择 **"当前用户"** 或 **"本地计算机"**
3. 输入密码
4. 选择 **"自动选择证书存储"** 或手动选择 **"个人"**
5. 完成导入

**查看已安装的证书：**

```powershell
# 查看当前用户的代码签名证书
Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert

# 查看本地计算机的证书
Get-ChildItem -Path Cert:\LocalMachine\My -CodeSigningCert
```

#### 3. 安装 Windows SDK（获取 signtool）

签名需要 `signtool.exe` 工具：

**方法 1：安装完整 Windows SDK**

下载地址：https://developer.microsoft.com/windows/downloads/windows-sdk/

**方法 2：通过 Visual Studio Installer**

1. 运行 Visual Studio Installer
2. 选择"修改"
3. 勾选"Windows 10/11 SDK"
4. 安装

**方法 3：通过 winget**

```powershell
winget install Microsoft.WindowsSDK.10.0.22621
```

**验证安装：**

```powershell
# 查找 signtool.exe
where.exe signtool

# 如果找不到，手动添加到 PATH：
# C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64
```

---

### Windows 本地开发签名

#### 方法 1：使用 PFX 文件

在项目根目录创建 `.env` 文件：

```bash
WIN_SIGN=true
AIONLY_CERT_PATH=C:\path\to\your\certificate.pfx
AIONLY_CERT_KEY=YourCertificateName
AIONLY_CERT_CSP=Microsoft Enhanced RSA and AES Cryptographic Provider
```

**查找证书参数：**

```powershell
# 查看可用的 CSP（Cryptographic Service Provider）
certutil -csplist

# 查看证书容器名称
certutil -key -user

# 查看证书信息
certutil -store -user My
```

**常见 CSP 值：**
- `Microsoft Enhanced RSA and AES Cryptographic Provider`（默认）
- `Microsoft Strong Cryptographic Provider`
- `Microsoft Base Cryptographic Provider v1.0`

**构建并签名：**

```powershell
# Windows PowerShell
pnpm build
```

#### 方法 2：使用 USB Token（如 YubiKey）

如果证书存储在硬件 Token 中：

```bash
WIN_SIGN=true
AIONLY_CERT_PATH=
AIONLY_CERT_KEY=YourTokenKeyName
AIONLY_CERT_CSP=YubiKey Smart Card Key Storage Provider
```

**查找 Token 信息：**

```powershell
# 列出所有密钥容器
certutil -key

# 查看 Smart Card 提供程序
certutil -csplist | Select-String -Pattern "Smart"
```

---

### Windows CI/CD 自动签名

#### 步骤 1：准备证书文件

如果使用云端签名服务（如 Azure Key Vault、DigiCert ONE），跳到相应章节。

对于本地证书文件：

```powershell
# 转换 PFX 为 base64（可选，用于存储到 Secrets）
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\certificate.pfx")) | Set-Clipboard
```

#### 步骤 2：添加 GitHub Secrets

访问：`https://github.com/你的用户名/aionly-studio/settings/secrets/actions`

添加以下 secrets：

| Secret Name | Value | 说明 |
|-------------|-------|------|
| `WIN_SIGN` | `true` | 启用 Windows 签名 |
| `AIONLY_CERT_PATH` | 证书文件路径或留空 | 本地路径或 base64（需配合 Actions） |
| `AIONLY_CERT_KEY` | 证书容器名称 | 从 `certutil -key` 获取 |
| `AIONLY_CERT_CSP` | CSP 提供商名称 | 如 `Microsoft Enhanced RSA and AES...` |
| `WIN_CERT_PASSWORD` | 证书密码（可选） | PFX 文件密码 |

#### 步骤 3：修改 GitHub Actions 配置

编辑文件：`.github/workflows/release.yml`

找到 **"Build Windows"** 步骤（约第 202 行），添加环境变量：

```yaml
      - name: Build Windows
        if: matrix.os == 'windows-latest'
        run: pnpm build:win
        env:
          # Windows 代码签名配置
          WIN_SIGN: ${{ secrets.WIN_SIGN }}
          AIONLY_CERT_PATH: ${{ secrets.AIONLY_CERT_PATH }}
          AIONLY_CERT_KEY: ${{ secrets.AIONLY_CERT_KEY }}
          AIONLY_CERT_CSP: ${{ secrets.AIONLY_CERT_CSP }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_OPTIONS: --max-old-space-size=8192
          # ... 其他环境变量保持不变
```

#### 步骤 4：验证签名脚本

确认 `scripts/win-sign.js` 存在且配置正确。该脚本已包含：

- 自动重试机制（每个时间戳服务器重试 3 次）
- 多个时间戳服务器备用
- 详细的错误日志

#### 步骤 5：提交并测试

```bash
git add .github/workflows/release.yml
git commit -m "feat: 启用 Windows 代码签名"
git push

# 触发构建
git tag v1.0.1
git push origin v1.0.1
```

---

## 常见问题

### macOS 签名问题

#### Q1: 找不到签名证书

```bash
# 检查证书是否在钥匙串中
security find-identity -v -p codesigning

# 如果为空，重新导入证书
open developerID_application.p12
```

#### Q2: 签名成功但验证失败

```bash
# 检查证书是否过期
openssl pkcs12 -in developerID_application.p12 -nokeys -passin pass:password | \
  openssl x509 -noout -dates

# 检查 Gatekeeper 状态
spctl --assess --verbose=4 "AiOnly.app"
```

#### Q3: CI 构建时签名失败

**可能原因：**
1. Base64 字符串被截断或包含换行符
2. 密码错误
3. GitHub Secrets 中的值前后有空格

**解决方法：**
```bash
# 重新生成 base64（确保无换行符）
base64 -i cert.p12 | tr -d '\n' | pbcopy

# 在 GitHub Secrets 中重新粘贴
```

### Windows 签名问题

#### Q1: signtool 找不到

```powershell
# 手动添加到 PATH
$env:Path += ";C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64"

# 或者在系统环境变量中永久添加
```

#### Q2: 时间戳服务器超时

**解决方法：**

脚本已包含多个备用时间戳服务器，如仍失败，可自定义：

```bash
# 在 .env 中添加
WIN_SIGN_TIMESTAMP_URLS=http://timestamp.digicert.com,http://timestamp.sectigo.com
```

#### Q3: 找不到证书容器

```powershell
# 列出所有可用的密钥容器
certutil -key -user

# 输出示例：
# Container name: VS_KEY_1234567890ABCDEF
# Provider = Microsoft Software Key Storage Provider
```

使用输出中的 "Container name" 作为 `AIONLY_CERT_KEY` 的值。

### 通用问题

#### Q1: 如何禁用签名？

**临时禁用（本地）：**

```bash
# macOS
unset CSC_LINK
unset CSC_KEY_PASSWORD

# Windows - 删除或注释 .env 中的 WIN_SIGN
```

**禁用 CI/CD 签名：**

删除或注释 workflow 文件中的相关环境变量。

#### Q2: 签名后文件大小显著增加

正常现象，签名会在可执行文件中嵌入证书信息，通常增加 5-50KB。

#### Q3: 用户仍然看到安全警告

**macOS：**
- 如果未公证，用户需要右键 → "打开" → "仍要打开"
- 考虑启用公证功能（需要 Apple 专用密码）

**Windows：**
- EV 证书立即受信任
- 标准证书需要积累 SmartScreen 信誉（数周到数月）
- 自签名证书始终显示警告

---

## 验证签名

### macOS 验证

```bash
# 查看签名信息
codesign -dv --verbose=4 "AiOnly.app"

# 验证签名有效性
codesign --verify --deep --strict --verbose=4 "AiOnly.app"

# 检查 Gatekeeper 评估
spctl -a -vv "AiOnly.app"

# 验证公证状态（如果已公证）
spctl --assess --type execute --verbose "AiOnly.app"
```

**成功输出示例：**
```
Authority=Developer ID Application: Your Name (TEAM_ID)
Authority=Developer ID Certification Authority
Authority=Apple Root CA
Signed Time=...
Info.plist=not bound
```

### Windows 验证

```powershell
# 使用 signtool 验证
signtool verify /pa /v "AiOnly.exe"

# 查看签名详情
signtool verify /pa /v /tw "AiOnly.exe"

# 通过 PowerShell 查看证书
Get-AuthenticodeSignature "AiOnly.exe" | Format-List *
```

**成功输出示例：**
```
SignerCertificate    : [Subject]
                        CN=YourCompany
Status               : Valid
StatusMessage        : Signature verified.
```

**通过 Windows 资源管理器验证：**

1. 右键点击 `AiOnly.exe`
2. 选择 **"属性"**
3. 切换到 **"数字签名"** 标签
4. 应该看到签名详情和证书信息

---

## 🔒 安全建议

### 证书管理

1. **永远不要将证书文件提交到 Git 仓库**
   - 添加 `*.p12`、`*.pfx`、`*.pem` 到 `.gitignore`
   
2. **使用强密码保护证书**
   - 至少 12 位，包含大小写字母、数字、符号

3. **定期轮换证书**
   - 证书过期前至少 30 天更新

4. **限制证书访问权限**
   - 仅授权人员可访问证书文件
   - GitHub Secrets 仅 Admin 权限可见

### CI/CD 安全

1. **使用 GitHub Secrets 存储敏感信息**
   - 永远不要在代码或日志中硬编码密码

2. **限制 Workflow 权限**
   - 使用 `permissions` 字段限制 token 权限

3. **启用分支保护**
   - 保护 `master` 分支，要求代码审查

4. **监控 Secrets 使用**
   - 定期审计 Actions 日志

---

## 📚 参考资源

### macOS 代码签名

- [Apple Developer - Code Signing](https://developer.apple.com/support/code-signing/)
- [electron-builder - macOS](https://www.electron.build/configuration/mac)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

### Windows 代码签名

- [Microsoft - Code Signing](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-reqs)
- [SignTool Documentation](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)
- [electron-builder - Windows](https://www.electron.build/configuration/win)

### 证书供应商

- [DigiCert](https://www.digicert.com/)
- [Sectigo](https://sectigo.com/)
- [GlobalSign](https://www.globalsign.com/)

---

## 🎯 快速检查清单

### macOS 签名清单

- [ ] 已获取 Developer ID Application 证书
- [ ] 已导出 .p12 文件并设置密码
- [ ] 本地测试签名成功（`codesign --verify`）
- [ ] 已转换 P12 为 base64
- [ ] 已在 GitHub 添加 `CSC_LINK` 和 `CSC_KEY_PASSWORD`
- [ ] 已修改 `.github/workflows/release.yml`
- [ ] 已确认 `electron-builder.yml` 中 `notarize: false`
- [ ] 已提交代码并触发构建
- [ ] CI 构建成功并生成已签名的 .dmg/.zip

### Windows 签名清单

- [ ] 已获取代码签名证书（商业或自签名）
- [ ] 已安装证书到系统
- [ ] 已安装 Windows SDK（signtool.exe）
- [ ] 已查找证书容器名称和 CSP
- [ ] 本地测试签名成功（`signtool verify`）
- [ ] 已在 GitHub 添加 `WIN_SIGN`、`AIONLY_CERT_*` secrets
- [ ] 已修改 `.github/workflows/release.yml`
- [ ] 已确认 `scripts/win-sign.js` 存在
- [ ] 已提交代码并触发构建
- [ ] CI 构建成功并生成已签名的 .exe

---

## 💬 获取帮助

如遇到问题，请提供以下信息：

1. 操作系统版本
2. 证书类型（商业 EV/标准/自签名）
3. 错误日志（脱敏后）
4. 已完成的步骤

---

**文档版本：** 1.0.0  
**最后更新：** 2026-08-06  
**维护者：** AiOnly Studio Team
