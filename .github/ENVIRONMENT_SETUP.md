# GitHub Environments 配置指南

本文档说明如何在 GitHub 上配置 Environments，以支持多环境打包。

## 前置条件

需要仓库管理员权限（Settings 权限）才能创建和配置 Environments。

## 配置步骤

### 第一步：进入 Environments 设置

1. 打开项目的 GitHub 页面
2. 点击顶部菜单 **Settings**
3. 左侧菜单找到 **Environments**（在 Security 区域下方）

### 第二步：创建 Environment

点击 **New environment** 按钮，创建以下 3 个 environment：
- `test`
- `production-cn`
- `production-global`

### 第三步：配置 Environment Variables

对于每个 environment，点击进入后：

1. 找到 **Environment variables** 区域
2. 点击 **Add variable** 按钮
3. 按照下方的配置表，逐个添加 4 个变量

## 需要创建的 Environments

### 配置详细说明

### 1. test（测试环境）

用于 cn 和 global 的测试版本（两者共用同一套测试环境 URL）

**配置步骤**：
1. 创建名为 `test` 的 environment
2. 添加以下 4 个 Environment Variables（注意：Name 必须完全一致）：

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://hf.rhwx-ai.com:9825/api` |
| `VITE_USER_UI_HOST` | `https://hf.rhwx-ai.com:9825` |
| `VITE_WEB_UI_HOST` | `https://hf.rhwx-ai.com:9820` |
| `APP_API_HOST` | `https://hf.rhwx-ai.com:9820/api/ai/v1/chat/completions` |

### 2. production-cn（生产环境-国内）

**配置步骤**：
1. 创建名为 `production-cn` 的 environment
2. 添加以下 4 个 Environment Variables：

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://www.aiionly.com/api` |
| `VITE_USER_UI_HOST` | `https://maas.aiionly.com` |
| `VITE_WEB_UI_HOST` | `https://www.aiionly.com` |
| `APP_API_HOST` | `https://llm.aiionly.com` |

### 3. production-global（生产环境-国际）

**配置步骤**：
1. 创建名为 `production-global` 的 environment
2. 添加以下 4 个 Environment Variables：

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://www.aionly.com/api` |
| `VITE_USER_UI_HOST` | `https://maas.aionly.com` |
| `VITE_WEB_UI_HOST` | `https://www.aionly.com` |
| `APP_API_HOST` | `https://api.aionly.com` |

---

## 快速检查清单

配置完成后，请确认：

- [ ] 已创建 3 个 environments：`test`、`production-cn`、`production-global`
- [ ] 每个 environment 都有 4 个 variables（共 12 个变量）
- [ ] 变量名完全一致（区分大小写）：`VITE_API_URL`、`VITE_USER_UI_HOST`、`VITE_WEB_UI_HOST`、`APP_API_HOST`
- [ ] URL 值无多余空格或换行符

---

## 使用方法

### 方式 1：通过 Tag 自动触发（推荐）

**Tag 命名规则**：
- 测试版：`v{version}-test`（如 `v1.0.0-test`）
- 正式版：`v{version}`（如 `v1.0.0`）
- cn 版本：在版本号后加 `-cn`（如 `v1.0.0-cn`、`v1.0.0-test-cn`）

**发版流程**：

#### 发布测试版
```bash
# 国际版测试
git tag v1.0.0-test
git push origin v1.0.0-test

# 国内版测试
git tag v1.0.0-test-cn
git push origin v1.0.0-test-cn
```
**自动行为**：
- Tag 包含 `-test` → 使用 `test` environment
- Tag 包含 `-cn` → 构建 `AiiOnly` + 使用 `production-cn` environment（如果没有 `-test`）
- Tag 不包含 `-cn` → 构建 `AiOnly` + 使用 `production-global` environment

**结果**：
- `v1.0.0-test` → Release `v1.0.0-test`，包含 `AiOnly-1.0.0-x64-setup.exe`（global-test）
- `v1.0.0-test-cn` → Release `v1.0.0-test-cn`，包含 `AiiOnly-1.0.0-x64-setup.exe`（cn-test）

#### 发布正式版
```bash
# 国际版正式
git tag v1.0.0
git push origin v1.0.0

# 国内版正式
git tag v1.0.0-cn
git push origin v1.0.0-cn
```

**结果**：
- `v1.0.0` → Release `v1.0.0`，包含 `AiOnly-1.0.0-x64-setup.exe`（global-production）
- `v1.0.0-cn` → Release `v1.0.0-cn`，包含 `AiiOnly-1.0.0-x64-setup.exe`（cn-production）

---

### 方式 2：手动触发 GitHub Actions

如果需要更灵活的控制（如指定不同的平台、临时打包等）：

1. 进入 `Actions` 标签页
2. 选择 `Release` workflow
3. 点击右侧 `Run workflow` 按钮
4. 选择参数：
   - **tag**: 版本号（如 `v1.0.0`）
   - **platform**: 构建平台（`all` / `windows` / `mac` / `linux`）
   - **flavor**: `cn` 或 `global`
   - **environment**: `test` / `production-cn` / `production-global`
5. 点击绿色的 `Run workflow` 按钮开始构建

**常用组合示例**：

| 场景 | 操作方式 | 说明 |
|---|---|---|
| 测试国内版 | `git tag v1.0.0-test-cn && git push origin v1.0.0-test-cn` | 自动使用测试环境 + AiiOnly |
| 测试国际版 | `git tag v1.0.0-test && git push origin v1.0.0-test` | 自动使用测试环境 + AiOnly |
| 发布国内正式版 | `git tag v1.0.0-cn && git push origin v1.0.0-cn` | 自动使用国内生产环境 + AiiOnly |
| 发布国际正式版 | `git tag v1.0.0 && git push origin v1.0.0` | 自动使用国际生产环境 + AiOnly |

**或者手动触发**：

| 场景 | flavor | environment | 说明 |
|---|---|---|---|
| 测试国内版 | `cn` | `test` | 使用测试环境 URL + 国内版配置（AiiOnly） |
| 测试国际版 | `global` | `test` | 使用测试环境 URL + 国际版配置（AiOnly） |
| 发布国内正式版 | `cn` | `production-cn` | 使用生产国内 URL + 国内版配置 |
| 发布国际正式版 | `global` | `production-global` | 使用生产国际 URL + 国际版配置 |

### 本地打包（可选）

本地打包默认使用 `config/cn/.env.override` 或 `config/global/.env.override` 中的值。

**如需临时覆盖（例如本地测试环境打包）**：

**Windows PowerShell**:
```powershell
$env:VITE_API_URL="https://hf.rhwx-ai.com:9825/api"
$env:VITE_USER_UI_HOST="https://hf.rhwx-ai.com:9825"
$env:VITE_WEB_UI_HOST="https://hf.rhwx-ai.com:9820"
$env:APP_API_HOST="https://hf.rhwx-ai.com:9820/api/ai/v1/chat/completions"
pnpm flavor:cn
pnpm build:win
```

**Windows CMD**:
```bash
set VITE_API_URL=https://hf.rhwx-ai.com:9825/api
set VITE_USER_UI_HOST=https://hf.rhwx-ai.com:9825
set VITE_WEB_UI_HOST=https://hf.rhwx-ai.com:9820
set APP_API_HOST=https://hf.rhwx-ai.com:9820/api/ai/v1/chat/completions
pnpm flavor:cn
pnpm build:win
```

**Linux/Mac**:
```bash
export VITE_API_URL=https://hf.rhwx-ai.com:9825/api
export VITE_USER_UI_HOST=https://hf.rhwx-ai.com:9825
export VITE_WEB_UI_HOST=https://hf.rhwx-ai.com:9820
export APP_API_HOST=https://hf.rhwx-ai.com:9820/api/ai/v1/chat/completions
pnpm flavor:cn
pnpm build:mac
```

---

## 优先级说明

环境变量的优先级从高到低：

1. **GitHub Environment Variables**（GitHub Actions 打包时，最高优先级）
2. **系统环境变量**（本地打包时手动设置的 `export` 或 `set` 命令）
3. **`config/{flavor}/.env.override`**（默认值，兜底配置）

这意味着：
- GitHub Actions 打包时，会使用你在 Web 界面配置的 Environment Variables
- 本地打包时，如果没有手动设置环境变量，会使用 `.env.override` 中的默认值

---

## 修改配置

要修改某个环境的 URL，只需：

1. 进入 `Settings → Environments`
2. 选择对应的 environment（如 `production-cn`）
3. 找到需要修改的 Variable，点击右侧的编辑图标
4. 修改 Value，点击 `Update variable`
5. **无需提交代码，下次构建自动生效**

---

## 常见问题

### Q1: 为什么需要配置 Environment Variables？

为了避免在代码中硬编码测试/生产环境的 URL。通过 GitHub Environments，开发者可以在 Web 界面直接修改配置，无需提交代码。

### Q2: 本地打包会使用哪个环境的配置？

本地打包默认使用 `config/{flavor}/.env.override` 中的配置。如果想使用测试环境，需要手动设置环境变量（参考上方"本地打包"章节）。

### Q3: 配置错了怎么办？

直接在 GitHub Environments 中修改对应的 Variable 即可，不需要重新创建 environment。

### Q4: 需要配置 Secrets 吗？

这 4 个 URL 配置为 **Variables**（非加密），而不是 Secrets。因为它们是公开的 API 地址，不是敏感信息。

### Q5: 如何验证配置是否生效？

构建完成后，检查生成的安装包：
1. 安装应用
2. 打开开发者工具（F12）
3. 在 Console 中输入：
   ```javascript
   console.log(window.location.origin) // 检查当前环境
   ```
4. 或查看网络请求的 API 地址是否正确

---

## 技术原理

整个流程如下：

```
GitHub Actions 触发
  ↓
读取 Environment Variables（如 production-cn 的配置）
  ↓
注入为系统环境变量
  ↓
运行 pnpm flavor:cn（switch-flavor.ts 优先读取环境变量）
  ↓
写入 .env.production 文件
  ↓
运行 pnpm build:win（Vite 读取 .env.production）
  ↓
编译时将环境变量注入到 import.meta.env
  ↓
生成最终的安装包（包含正确的环境配置）
```
