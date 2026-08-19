export const CLAW_AGENT_ID = 'aionly-claw-default'
export const ASSISTANT_AGENT_ID = 'aionly-assistant-default'

const BUILTIN_AGENT_IDS = new Set([CLAW_AGENT_ID, ASSISTANT_AGENT_ID])

export function isBuiltinAgentId(id: string): boolean {
  return BUILTIN_AGENT_IDS.has(id)
}
