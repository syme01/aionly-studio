/**
 * Sanitize Gemini Tool Schema Plugin
 *
 * Gemini 的 function calling 只支持 OpenAPI Schema 的一个子集，其 Schema 结构中
 * 不存在 additionalProperties / $schema / patternProperties 字段，透传会被 Google
 * 上游以 400 "Unknown name ... at 'tools.function_declarations[N].parameters':
 * Cannot find field" 拒绝。
 *
 * 前端用 zod 定义的工具（如 builtin_web_search）经 zod-to-json-schema 转换后默认
 * 就带 $schema 和 additionalProperties: false；MCP 工具的 inputSchema 也会原样
 * 透传服务端 schema。中转做 OpenAI→Gemini 格式转换时不会剥离这些字段，
 * 必须在语言模型层统一清理。
 */
import { definePlugin } from '@aionly/ai-core'
import { loggerService } from '@logger'
import type { LanguageModelMiddleware } from 'ai'

const logger = loggerService.withContext('sanitizeGeminiToolSchemaPlugin')

/** Gemini Schema 不支持的字段，出现即删除（列表可按上游报错扩展） */
const UNSUPPORTED_SCHEMA_KEYS = new Set(['additionalProperties', '$schema', 'patternProperties'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 递归删除 Gemini 不支持的 JSON Schema 字段。
 * 节点未被修改时返回原引用，避免不必要的拷贝。
 */
function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) {
    let changed = false
    const items = node.map((item) => {
      const sanitized = sanitizeSchema(item)
      if (sanitized !== item) {
        changed = true
      }
      return sanitized
    })
    return changed ? items : node
  }

  if (!isPlainObject(node)) {
    return node
  }

  let changed = false
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_SCHEMA_KEYS.has(key)) {
      changed = true
      continue
    }
    const sanitizedValue = sanitizeSchema(value)
    if (sanitizedValue !== value) {
      changed = true
    }
    sanitized[key] = sanitizedValue
  }
  return changed ? sanitized : node
}

function createSanitizeGeminiToolSchemaMiddleware(): LanguageModelMiddleware {
  return {
    specificationVersion: 'v3',

    transformParams: async ({ params }) => {
      if (!Array.isArray(params.tools) || params.tools.length === 0) {
        return params
      }

      let sanitizedCount = 0
      const tools = params.tools.map((tool) => {
        if (tool.type !== 'function') {
          return tool
        }
        const inputSchema = sanitizeSchema(tool.inputSchema)
        if (inputSchema === tool.inputSchema) {
          return tool
        }
        sanitizedCount++
        return { ...tool, inputSchema } as typeof tool
      })

      if (sanitizedCount > 0) {
        logger.info(`Sanitized unsupported JSON schema field(s) from ${sanitizedCount} tool(s) for Gemini`)
        return { ...params, tools }
      }
      return params
    }
  }
}

export const createSanitizeGeminiToolSchemaPlugin = () =>
  definePlugin({
    name: 'sanitizeGeminiToolSchema',
    enforce: 'pre',

    configureContext: (context) => {
      context.middlewares = context.middlewares || []
      context.middlewares.push(createSanitizeGeminiToolSchemaMiddleware())
    }
  })
