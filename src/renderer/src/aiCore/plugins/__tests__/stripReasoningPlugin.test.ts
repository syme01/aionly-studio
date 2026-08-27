import type { LanguageModelV3CallOptions } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'

import { createStripReasoningPlugin } from '../stripReasoningPlugin'

function makeTextPart(text: string) {
  return { type: 'text' as const, text }
}

function makeReasoningPart(text: string) {
  return { type: 'reasoning' as const, text }
}

function makeToolCallPart() {
  return {
    type: 'tool-call' as const,
    toolCallId: 'call-1',
    toolName: 'web_search',
    input: { query: 'test' }
  }
}

function makeToolResultPart() {
  return {
    type: 'tool-result' as const,
    toolCallId: 'call-1',
    toolName: 'web_search',
    output: { type: 'text' as const, value: 'search result' }
  }
}

async function runMiddleware(params: LanguageModelV3CallOptions) {
  const plugin = createStripReasoningPlugin()
  const context: {
    middlewares: Array<{ transformParams: (opts: Record<string, unknown>) => Promise<LanguageModelV3CallOptions> }>
  } = { middlewares: [] }
  void plugin.configureContext!(context as never)
  const middleware = context.middlewares[0]
  return middleware.transformParams({ params, type: 'generate', model: {} })
}

describe('stripReasoningPlugin', () => {
  it('strips reasoning parts from history assistant messages', async () => {
    const params = {
      prompt: [
        { role: 'user' as const, content: [makeTextPart('Hello')] },
        {
          role: 'assistant' as const,
          content: [makeReasoningPart('Thinking...'), makeTextPart('Answer')]
        },
        { role: 'user' as const, content: [makeTextPart('Follow up')] }
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.prompt).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'Answer' }] },
      { role: 'user', content: [{ type: 'text', text: 'Follow up' }] }
    ])
  })

  it('strips reasoning but keeps tool-call parts (tool-loop round-trip)', async () => {
    // SDK 多步工具调用循环回传的 assistant 消息：reasoning + tool-call。
    // reasoning 必须被移除（reasoning_content 会导致中转上游 422），
    // tool-call 必须保留，否则工具配对断裂。
    const params = {
      prompt: [
        {
          role: 'assistant' as const,
          content: [makeReasoningPart('Thinking about which tool to use'), makeToolCallPart()]
        },
        { role: 'tool' as const, content: [makeToolResultPart()] }
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.prompt[0]).toMatchObject({
      role: 'assistant',
      content: [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'web_search' }]
    })
    expect(result.prompt[1]).toEqual(params.prompt[1])
  })

  it('reduces reasoning-only assistant messages to empty content', async () => {
    const params = {
      prompt: [{ role: 'assistant' as const, content: [makeReasoningPart('Only thinking')] }]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.prompt[0]).toEqual({ role: 'assistant', content: [] })
  })

  it('returns params unchanged when no reasoning parts are present', async () => {
    const params = {
      prompt: [
        { role: 'user' as const, content: [makeTextPart('Hello')] },
        {
          role: 'assistant' as const,
          content: [makeTextPart('Answer'), makeToolCallPart()]
        },
        { role: 'tool' as const, content: [makeToolResultPart()] }
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result).toEqual(params)
  })

  it('passes through messages with string content (system messages)', async () => {
    const params = {
      prompt: [{ role: 'system' as const, content: 'You are a helpful assistant' }]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.prompt[0]).toMatchObject({ role: 'system', content: 'You are a helpful assistant' })
  })

  it('passes through when prompt is empty', async () => {
    const params = { prompt: [] } as unknown as LanguageModelV3CallOptions
    const result = await runMiddleware(params)
    expect(result).toEqual(params)
  })

  it('keeps non-reasoning parts across multiple messages intact', async () => {
    const params = {
      prompt: [
        { role: 'user' as const, content: 'string content' },
        {
          role: 'assistant' as const,
          content: [makeReasoningPart('step 1'), makeTextPart('partial'), makeReasoningPart('step 2')]
        }
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.prompt[1]).toMatchObject({
      role: 'assistant',
      content: [{ type: 'text', text: 'partial' }]
    })
  })
})
