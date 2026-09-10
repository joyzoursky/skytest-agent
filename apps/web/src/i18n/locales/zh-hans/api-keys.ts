import type { Messages } from '../../types';

export const ZH_HANS_API_KEYS_MESSAGES = {
  "apiKeys.title": "API Key",
  "apiKeys.description": "API Key 用于验证 SkyTest runner CLI。可通过 --api-key 传入，或在 runner 环境中设置 SKYTEST_API_KEY。",
  "apiKeys.mcpNotice": "MCP 客户端不使用 API Key。请从“连接 MCP”页面连接，代理会改以你的账户登录。",
  "apiKeys.generate": "生成 Key",
  "apiKeys.name": "Key 名称",
  "apiKeys.name.placeholder": "例：build-runner",
  "apiKeys.prefix": "前缀",
  "apiKeys.lastUsed": "最后使用",
  "apiKeys.never": "从未",
  "apiKeys.revoke": "撤销",
  "apiKeys.revokeConfirm.title": "撤销 API Key",
  "apiKeys.revokeConfirm.body": "撤销“{name}”？使用此 Key 的 runner 将失去访问权限。",
  "apiKeys.revokeConfirm.confirm": "撤销",
  "apiKeys.created.warning": "请立即复制此 Key，之后将不再显示。",
  "apiKeys.created.modal.title": "API Key 已创建",
  "apiKeys.created.modal.keyLabel": "API Key",
  "apiKeys.noKeys": "尚无 API Key。",
} satisfies Messages;
