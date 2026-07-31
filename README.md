<h1 align="center">
  <img src="./build/icon.png" width="120" height="120" alt="AiOnly " /><br>
  AiOnly
</h1>

<p align="center">A powerful desktop AI assistant client</p>
<p align="center">English | <a href="./docs/zh/README.md">中文</a></p>

---

## 🚀 About

AiOnly  is a cross-platform desktop application that provides seamless access to multiple AI language models. Built with modern technologies, it offers a clean and intuitive interface for AI-powered conversations, content generation, and productivity enhancement.

## ✨ Features

- **Multi-Model Support**: Connect to OpenAI, Anthropic, Google Gemini, and other major AI providers
- **Local AI**: Support for Ollama and other local model runners
- **Rich Content**: Handle text, images, documents, and code with syntax highlighting
- **Knowledge Management**: Built-in knowledge base and document processing
- **Cross-Platform**: Available on Windows, macOS, and Linux
- **Modern UI**: Clean interface with light/dark themes
- **Privacy First**: Your data stays on your device

## 📦 Installation

Download the latest release for your platform:

- **Windows**: `AiOnly--Setup-x.x.x.exe`
- **macOS**: `AiOnly--x.x.x.dmg`
- **Linux**: `AiOnly--x.x.x.AppImage`

## 🛠️ Development

### Prerequisites

- Node.js ≥ 22
- pnpm 10.27.0

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

### Project Structure

```
src/
  main/          # Electron main process
  renderer/      # React UI
  preload/       # IPC bridge
packages/
  aiCore/        # AI provider abstraction
  shared/        # Shared utilities
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

Copyright © 2024-2026 AiOnly

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

For licensing inquiries, please contact: license@aionly.com

---

<p align="center">Made with ❤️ by AiOnly Team</p>
