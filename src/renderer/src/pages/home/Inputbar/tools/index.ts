// Tool registry loader
// Import all tool definitions to register them

import './attachmentTool'
import './mentionModelsTool'
import './newTopicTool'
import './quickPhrasesTool'
import './thinkingTool'
import './webSearchTool'
import './urlContextTool'
// import './knowledgeBaseTool' // TODO: 知识库功能，暂时注释掉，目前平台没有向量模型，后期可能需要放开
import './mcpToolsTool'
import './generateImageTool'
import './clearTopicTool'
import './toggleExpandTool'
import './newContextTool'
// Agent Session tools
import './createSessionTool'
import './slashCommandsTool'
import './resourceTool'
import './permissionModeTool'

// Export registry functions
export { getAllTools, getTool, getToolsForScope, registerTool } from '../types'
