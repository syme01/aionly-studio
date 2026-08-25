import { definePlugin } from '@aionly/ai-core'
import { loggerService } from '@logger'
import type { LanguageModelMiddleware } from 'ai'

const logger = loggerService.withContext('skipGeminiThoughtSignaturePlugin')

/**
 * skip Gemini Thought Signature Middleware
 *
 * Handles:
 * - Tool-call parts need thought_signature for OpenAI-compatible API
 *   -> Add providerOptions.openaiCompatible.extra_content.google.thought_signature
 *
 * Note: Thought signature for text/reasoning parts is now handled in messageConverter.
 *
 * @returns LanguageModelMiddleware
 */
function createSkipGeminiThoughtSignatureMiddleware(): LanguageModelMiddleware {
  const MAGIC_STRING = 'skip_thought_signature_validator'
  return {
    specificationVersion: 'v3',

    transformParams: async ({ params }) => {
      const transformedParams = { ...params }
      logger.debug('transformedParams', transformedParams)
      // Process messages in prompt
      if (transformedParams.prompt && Array.isArray(transformedParams.prompt)) {
        transformedParams.prompt = transformedParams.prompt.map((message) => {
          if (typeof message.content !== 'string') {
            for (const part of message.content) {
              const isToolCallPart = part.type === 'tool-call'

              // Note: text part and reasoning part do not require thought signature validation
              // They are handled by messageConverter now

              // Case: OpenAI-compatible path - add thought_signature for tool-call parts
              // All tool-calls need the signature for Gemini OpenAI-compatible API
              if (isToolCallPart) {
                if (!part.providerOptions) {
                  part.providerOptions = {}
                }
                if (!part.providerOptions.openaiCompatible) {
                  part.providerOptions.openaiCompatible = {}
                }

                // ⚠️ FIXED 2026-08-25: Gemini API 报错 thought_signature 位置不正确
                // 错误信息: "Function call is missing a thought_signature in functionCall parts"
                //
                // 旧实现（错误）:
                // part.providerOptions.openaiCompatible.extra_content = {
                //   google: {
                //     thought_signature: MAGIC_STRING
                //   }
                // }
                // 问题: thought_signature 被嵌套在 extra_content.google 中,
                // 但 Gemini OpenAI-compatible API 期望它直接在 functionCall 对象的顶层
                //
                // 新实现（正确）:
                // thought_signature 直接放在 openaiCompatible 对象中,
                // @ai-sdk/openai-compatible 会将其映射到 API 请求的 functionCall 对象顶层
                // See: https://ai.google.dev/gemini-api/docs/thought-signatures
                part.providerOptions.openaiCompatible.thought_signature = MAGIC_STRING
              }
            }
          }
          return message
        })
      }

      return transformedParams
    }
  }
}

export const createSkipGeminiThoughtSignaturePlugin = () =>
  definePlugin({
    name: 'skipGeminiThoughtSignature',
    enforce: 'pre',

    configureContext: (context) => {
      context.middlewares = context.middlewares || []
      context.middlewares.push(createSkipGeminiThoughtSignatureMiddleware())
    }
  })
