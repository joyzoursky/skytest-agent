'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { Button, DangerTextButton, LoadingSpinner, Modal } from '@/components/shared';
import { useI18n } from '@/i18n';
import { runOnEnterKey } from '@/utils/keyboard/enterKey';
import { formatDateTime } from '@/utils/time/dateFormatter';

interface AgentApiKey {
    id: string;
    name: string;
    prefix: string;
    lastUsedAt: string | null;
    createdAt: string;
}

export default function ApiKeysPage() {
    const { isLoggedIn, isLoading: isAuthLoading, getAccessToken } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    const [isLoading, setIsLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<AgentApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [isGeneratedKeyModalOpen, setIsGeneratedKeyModalOpen] = useState(false);
    const [isGeneratedKeyCopied, setIsGeneratedKeyCopied] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [keyToRevoke, setKeyToRevoke] = useState<AgentApiKey | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push('/');
        }
    }, [isAuthLoading, isLoggedIn, router]);

    const fetchApiKeys = useCallback(async () => {
        const token = await getAccessToken();
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/api/user/api-keys', { headers });
        if (res.ok) {
            const data = await res.json();
            setApiKeys(data);
        }
    }, [getAccessToken]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isLoggedIn) return;
            setIsLoading(true);
            try {
                await fetchApiKeys();
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isLoggedIn, fetchApiKeys]);

    const handleGenerateApiKey = async () => {
        if (!newKeyName.trim()) return;
        setIsGenerating(true);
        try {
            const token = await getAccessToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const res = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: newKeyName.trim() })
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedKey(data.key);
                setIsGeneratedKeyCopied(false);
                setIsGeneratedKeyModalOpen(true);
                setNewKeyName('');
                await fetchApiKeys();
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const closeGeneratedKeyModal = useCallback(() => {
        setIsGeneratedKeyModalOpen(false);
        setGeneratedKey(null);
        setIsGeneratedKeyCopied(false);
    }, []);

    const handleCopyGeneratedKey = async () => {
        if (!generatedKey) return;

        try {
            await navigator.clipboard.writeText(generatedKey);
            setIsGeneratedKeyCopied(true);
            window.setTimeout(() => setIsGeneratedKeyCopied(false), 1500);
        } catch (error) {
            console.error('Failed to copy generated key', error);
        }
    };

    const handleRevokeApiKey = async () => {
        if (!keyToRevoke) return;
        const token = await getAccessToken();
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`/api/user/api-keys/${keyToRevoke.id}`, { method: 'DELETE', headers });
        if (res.ok) {
            setApiKeys(prev => prev.filter(k => k.id !== keyToRevoke.id));
        }
        setIsRevokeModalOpen(false);
        setKeyToRevoke(null);
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                <LoadingSpinner size={24} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Modal
                isOpen={isRevokeModalOpen}
                onClose={() => { setIsRevokeModalOpen(false); setKeyToRevoke(null); }}
                title={t('apiKeys.revokeConfirm.title')}
                onConfirm={handleRevokeApiKey}
                confirmText={t('apiKeys.revokeConfirm.confirm')}
                confirmVariant="danger"
            >
                <p className="text-sm text-gray-700">
                    {t('apiKeys.revokeConfirm.body', { name: keyToRevoke?.name ?? '' })}
                </p>
            </Modal>
            <Modal
                isOpen={isGeneratedKeyModalOpen}
                onClose={closeGeneratedKeyModal}
                title={t('apiKeys.created.modal.title')}
                showFooter={false}
                panelClassName="max-w-xl"
            >
                <div className="space-y-5">
                    <p className="text-sm text-gray-500">{t('apiKeys.created.warning')}</p>

                    <div>
                        <p className="text-sm font-medium text-gray-900">{t('apiKeys.created.modal.keyLabel')}</p>
                        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                            <p className="break-all font-mono text-sm text-gray-900">{generatedKey}</p>
                        </div>
                        <div className="mt-2 flex justify-end">
                            <Button
                                onClick={() => void handleCopyGeneratedKey()}
                                variant="secondary"
                                size="xs"
                                disabled={!generatedKey}
                            >
                                {isGeneratedKeyCopied ? t('common.copied') : t('common.copy')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={closeGeneratedKeyModal} variant="primary" size="sm">
                            {t('common.done')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('apiKeys.title')}</h1>
                <p className="text-sm text-gray-500 mb-2">{t('apiKeys.description')}</p>
                <p className="text-sm text-gray-500 mb-6">{t('apiKeys.mcpNotice')}</p>

                <div className="flex items-center gap-3 mb-6">
                    <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => {
                            runOnEnterKey(e, () => {
                                void handleGenerateApiKey();
                            });
                        }}
                        placeholder={t('apiKeys.name.placeholder')}
                        className="w-72 px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                        onClick={handleGenerateApiKey}
                        disabled={isGenerating || !newKeyName.trim()}
                        variant="primary"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {t('apiKeys.generate')}
                    </Button>
                </div>

                {apiKeys.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('apiKeys.noKeys')}</p>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('apiKeys.name')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('apiKeys.prefix')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('apiKeys.lastUsed')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('usage.table.dateTime')}</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {apiKeys.map((key) => (
                                    <tr key={key.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-700">{key.name}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{key.prefix}...</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : t('apiKeys.never')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(key.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <DangerTextButton
                                                onClick={() => { setKeyToRevoke(key); setIsRevokeModalOpen(true); }}
                                                size="sm"
                                                tone="strong"
                                            >
                                                {t('apiKeys.revoke')}
                                            </DangerTextButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
