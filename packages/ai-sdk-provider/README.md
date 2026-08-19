# @aionly/ai-sdk-provider

Market provider bundle for the [Vercel AI SDK](https://ai-sdk.dev/).  
It exposes the Market OpenAI-compatible entrypoints and dynamically routes Anthropic and Gemini model ids to their Market upstream equivalents.

## Installation

```bash
npm install ai @aionly/ai-sdk-provider @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
# or
pnpm add ai @aionly/ai-sdk-provider @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
```

> **Note**: This package requires peer dependencies `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, and `@ai-sdk/openai` to be installed.

## Usage

```ts
import { createMarket, market } from '@aionly/ai-sdk-provider'

const marketProvider = createMarket({
  apiKey: process.env.MARKET_API_KEY,
  // optional overrides:
  // baseURL: 'https://open.cherryin.net/v1',
  // anthropicBaseURL: 'https://open.cherryin.net/anthropic',
  // geminiBaseURL: 'https://open.cherryin.net/gemini/v1beta',
})

// Chat models will auto-route based on the model id prefix:
const openaiModel = marketProvider.chat('gpt-4o-mini')
const anthropicModel = marketProvider.chat('claude-3-5-sonnet-latest')
const geminiModel = marketProvider.chat('gemini-2.0-pro-exp')

const { text } = await openaiModel.invoke('Hello Market!')
```

The provider also exposes `completion`, `responses`, `embedding`, `image`, `transcription`, and `speech` helpers aligned with the upstream APIs.

See [AI SDK docs](https://ai-sdk.dev/providers/community-providers/custom-providers) for configuring custom providers.
