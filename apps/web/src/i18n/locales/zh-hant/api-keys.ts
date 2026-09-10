import type { Messages } from '../../types';

export const ZH_HANT_API_KEYS_MESSAGES = {
  "apiKeys.title": "API Key",
  "apiKeys.description": "API Key 用於驗證 SkyTest runner CLI。可透過 --api-key 傳入，或在 runner 環境中設定 SKYTEST_API_KEY。",
  "apiKeys.mcpNotice": "MCP 用戶端不使用 API Key。請從「連接 MCP」頁面連接，代理會改以你的帳戶登入。",
  "apiKeys.generate": "生成 Key",
  "apiKeys.name": "Key 名稱",
  "apiKeys.name.placeholder": "例：build-runner",
  "apiKeys.prefix": "前綴",
  "apiKeys.lastUsed": "最後使用",
  "apiKeys.never": "從未",
  "apiKeys.revoke": "撤銷",
  "apiKeys.revokeConfirm.title": "撤銷 API Key",
  "apiKeys.revokeConfirm.body": "撤銷「{name}」？使用此 Key 的 runner 將失去存取權限。",
  "apiKeys.revokeConfirm.confirm": "撤銷",
  "apiKeys.created.warning": "請立即複製此 Key，之後將不再顯示。",
  "apiKeys.created.modal.title": "API Key 已建立",
  "apiKeys.created.modal.keyLabel": "API Key",
  "apiKeys.noKeys": "尚無 API Key。",
} satisfies Messages;
