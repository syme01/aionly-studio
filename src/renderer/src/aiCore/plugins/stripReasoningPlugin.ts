/**
 * Strip Reasoning Plugin
 *
 * OpenAI 兼容中转（非官方 OpenAI 端点）不接受 assistant 消息中的 reasoning 回传：
 * @ai-sdk/openai-compatible 会将 reasoning part 序列化为 reasoning_content 字段，
 * 中转将其转换为缺少 summary 的 Responses reasoning item 时会被上游拒绝（422）。
 *
 * parameterBuilder 只能过滤历史消息；SDK 工具调用多步循环会把当前轮次的
 * reasoning part 重新发给模型，不经过 parameterBuilder，必须在语言模型层拦截。
 */
import type { LanguageModelV3Message } from '@ai-sdk/provider'
import { definePlugin } from '@aionly/ai-core'
import { loggerService } from '@logger'
import type { LanguageModelMiddleware } from 'ai'

const logger = loggerService.withContext('stripReasoningPlugin')

type ContentPart = Exclude<LanguageModelV3Message['content'], string>[number]

function createStripReasoningMiddleware(): LanguageModelMiddleware {
  return {
    specificationVersion: 'v3',

    transformParams: async ({ params }) => {
      if (!Array.isArray(params.prompt) || params.prompt.length === 0) {
        return params
      }

      let strippedCount = 0
      const messages: LanguageModelV3Message[] = []
      for (const message of params.prompt) {
        // system 消息及字符串 content 的 user 消息没有 reasoning part
        if (typeof message.content === 'string') {
          messages.push(message)
          continue
        }

        const newContent: ContentPart[] = []
        for (const part of message.content) {
          if (part.type === 'reasoning') {
            strippedCount++
            continue
          }
          newContent.push(part)
        }

        if (newContent.length === message.content.length) {
          messages.push(message)
          continue
        }
        messages.push(Object.assign({}, message, { content: newContent }))
      }

      if (strippedCount > 0) {
        logger.info(`Stripped ${strippedCount} reasoning part(s) from outgoing prompt`)
        return { ...params, prompt: messages }
      }
      return params
    }
  }
}

export const createStripReasoningPlugin = () =>
  definePlugin({
    name: 'stripReasoning',
    enforce: 'pre',

    configureContext: (context) => {
      context.middlewares = context.middlewares || []
      context.middlewares.push(createStripReasoningMiddleware())
    }
  })
