import type { Messages } from '../../types';

export const EN_API_KEYS_MESSAGES = {
  "apiKeys.title": "API Keys",
  "apiKeys.description": "API keys authenticate the SkyTest runner CLI. Pass one with --api-key, or set SKYTEST_API_KEY in the runner's environment.",
  "apiKeys.mcpNotice": "MCP clients do not use API keys. Connect them from the Connect MCP page, where your agent signs in with your account instead.",
  "apiKeys.generate": "Generate Key",
  "apiKeys.name": "Key Name",
  "apiKeys.name.placeholder": "e.g. build-runner",
  "apiKeys.prefix": "Prefix",
  "apiKeys.lastUsed": "Last Used",
  "apiKeys.never": "Never",
  "apiKeys.revoke": "Revoke",
  "apiKeys.revokeConfirm.title": "Revoke API Key",
  "apiKeys.revokeConfirm.body": "Revoke \"{name}\"? Any runner using this key will lose access.",
  "apiKeys.revokeConfirm.confirm": "Revoke",
  "apiKeys.created.warning": "Copy this key now. It will not be shown again.",
  "apiKeys.created.modal.title": "API Key Created",
  "apiKeys.created.modal.keyLabel": "API Key",
  "apiKeys.noKeys": "No API keys yet.",
} satisfies Messages;
