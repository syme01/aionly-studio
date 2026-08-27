import type { LanguageModelV3CallOptions } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'

import { createSanitizeGeminiToolSchemaPlugin } from '../sanitizeGeminiToolSchemaPlugin'

function makeTool(name: string, inputSchema: unknown) {
  return { type: 'function' as const, name, description: `Tool ${name}`, inputSchema }
}

async function runMiddleware(params: LanguageModelV3CallOptions) {
  const plugin = createSanitizeGeminiToolSchemaPlugin()
  const context: {
    middlewares: Array<{ transformParams: (opts: Record<string, unknown>) => Promise<LanguageModelV3CallOptions> }>
  } = { middlewares: [] }
  void plugin.configureContext!(context as never)
  const middleware = context.middlewares[0]
  return middleware.transformParams({ params, type: 'generate', model: {} })
}

describe('sanitizeGeminiToolSchemaPlugin', () => {
  it('strips $schema and additionalProperties from the builtin_web_search schema (real relay 400 payload)', async () => {
    // 来自 api.aionly.com 中转真实 400 报错的入参：
    // Unknown name "additionalProperties" at 'tools.function_declarations[0].parameters'
    const params = {
      tools: [
        makeTool('builtin_web_search', {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            additionalContext: {
              description: 'Optional additional context, keywords, or specific focus to enhance the search',
              type: 'string'
            }
          },
          additionalProperties: false
        })
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.tools?.[0]).toEqual({
      type: 'function',
      name: 'builtin_web_search',
      description: 'Tool builtin_web_search',
      inputSchema: {
        type: 'object',
        properties: {
          additionalContext: {
            description: 'Optional additional context, keywords, or specific focus to enhance the search',
            type: 'string'
          }
        }
      }
    })
  })

  it('recursively strips nested unsupported fields (object-form additionalProperties, patternProperties)', async () => {
    // 对象形式 additionalProperties（内置 navigate 工具的 query 参数）与深层嵌套的 patternProperties
    const params = {
      tools: [
        makeTool('navigate', {
          type: 'object',
          properties: {
            query: {
              type: 'object',
              description: 'Optional URL query parameters',
              additionalProperties: { type: 'string' }
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  meta: {
                    type: 'object',
                    patternProperties: {
                      '^x-': { type: 'string' }
                    }
                  }
                },
                required: ['meta']
              }
            }
          },
          required: ['query'],
          additionalProperties: false
        })
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.tools?.[0]).toEqual({
      type: 'function',
      name: 'navigate',
      description: 'Tool navigate',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'object',
            description: 'Optional URL query parameters'
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                meta: {
                  type: 'object'
                }
              },
              required: ['meta']
            }
          }
        },
        required: ['query']
      }
    })
  })

  it('sanitizes every tool independently', async () => {
    const params = {
      tools: [
        makeTool('tool_a', { type: 'object', additionalProperties: false }),
        makeTool('tool_b', { type: 'object', $schema: 'http://json-schema.org/draft-07/schema#' })
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result.tools?.[0]).toMatchObject({ name: 'tool_a', inputSchema: { type: 'object' } })
    expect(result.tools?.[1]).toMatchObject({ name: 'tool_b', inputSchema: { type: 'object' } })
  })

  it('returns the original params reference when schemas are already clean', async () => {
    const params = {
      tools: [
        makeTool('clean_tool', {
          type: 'object',
          properties: { query: { type: 'string', description: 'search query' } },
          required: ['query']
        })
      ]
    } as unknown as LanguageModelV3CallOptions

    const result = await runMiddleware(params)
    expect(result).toBe(params)
  })

  it('returns params unchanged when tools are absent', async () => {
    const params = { prompt: [] } as unknown as LanguageModelV3CallOptions
    const result = await runMiddleware(params)
    expect(result).toBe(params)
  })

  it('does not mutate the original tool schemas', async () => {
    const inputSchema = { type: 'object', properties: {}, additionalProperties: false }
    const originalTool = makeTool('immutable', inputSchema)
    const params = { tools: [originalTool] } as unknown as LanguageModelV3CallOptions

    await runMiddleware(params)
    expect(inputSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false })
    expect(params.tools?.[0]).toBe(originalTool)
  })
})
