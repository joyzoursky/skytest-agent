'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { CopyableCodeBlock, LoadingSpinner } from '@/components/shared';
import { useI18n } from '@/i18n';

const SKYTEST_SKILLS_REPO_URL = 'https://github.com/oursky/skytest-agent/tree/main/skills/skytest-skills';

function escapeForSingleQuotedShellArg(value: string): string {
    return value.replace(/'/g, "'\\''");
}

export default function McpPage() {
    const { isLoggedIn, isLoading: isAuthLoading, authgearConfig } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push('/');
        }
    }, [isAuthLoading, isLoggedIn, router]);

    // The configured resource URI is what the server validates tokens against, so showing it
    // avoids advertising an endpoint that would fail on audience. It is also render-stable, unlike
    // window.location, which would differ between the server and client passes.
    const mcpEndpoint = authgearConfig.mcpResourceUri || '/api/mcp';

    const claudeCodeCommand = useMemo(() => (
        `claude mcp add --scope user --transport http skytest '${escapeForSingleQuotedShellArg(mcpEndpoint)}'`
    ), [mcpEndpoint]);

    const codexCommand = useMemo(() => [
        `codex mcp add skytest --url '${escapeForSingleQuotedShellArg(mcpEndpoint)}'`,
        'codex mcp login skytest',
    ].join('\n'), [mcpEndpoint]);

    const generalConfigExample = useMemo(() => `{
  "mcpServers": {
    "skytest": {
      "type": "http",
      "url": "${mcpEndpoint}"
    }
  }
}`, [mcpEndpoint]);

    const skillInstallPrompt = t('mcp.connection.skillInstall.prompt', { link: SKYTEST_SKILLS_REPO_URL });

    const copySection = useCallback(async (section: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedSection(section);
            window.setTimeout(() => setCopiedSection((current) => (current === section ? null : current)), 1500);
        } catch (error) {
            console.error('Failed to copy to clipboard', error);
        }
    }, []);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                <LoadingSpinner size={24} />
            </div>
        );
    }

    const scopeRows = [
        { scope: 'read:tools', description: t('mcp.scopes.read') },
        { scope: 'write:tools', description: t('mcp.scopes.write') },
        { scope: 'execute:tools', description: t('mcp.scopes.execute') },
    ];

    const connectionSections = [
        {
            id: 'endpoint',
            title: t('mcp.connection.endpoint.title'),
            summary: t('mcp.connection.endpoint.summary'),
            code: mcpEndpoint,
        },
        {
            id: 'claudeCode',
            title: t('mcp.connection.claudeCode.title'),
            summary: t('mcp.connection.claudeCode.summary'),
            code: claudeCodeCommand,
        },
        {
            id: 'codex',
            title: t('mcp.connection.codex.title'),
            summary: t('mcp.connection.codex.summary'),
            code: codexCommand,
        },
        {
            id: 'general',
            title: t('mcp.connection.general.title'),
            summary: t('mcp.connection.general.summary'),
            code: generalConfigExample,
        },
    ];

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('mcp.title')}</h1>
                <p className="text-sm text-gray-500 mb-8">{t('mcp.subtitle')}</p>

                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('mcp.connection.title')}</h2>
                    <div className="space-y-5">
                        <p className="text-sm text-gray-600">{t('mcp.connection.summary')}</p>

                        {connectionSections.map((section) => (
                            <div key={section.id}>
                                <p className="text-sm font-medium text-gray-900 mb-1">{section.title}</p>
                                <p className="text-sm text-gray-500 mb-2">{section.summary}</p>
                                <CopyableCodeBlock
                                    code={section.code}
                                    copied={copiedSection === section.id}
                                    onCopy={() => void copySection(section.id, section.code)}
                                    copyLabel={t('common.copy')}
                                    copiedLabel={t('common.copied')}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('mcp.signIn.title')}</h2>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600">
                        <li>{t('mcp.signIn.step1')}</li>
                        <li>{t('mcp.signIn.step2')}</li>
                        <li>{t('mcp.signIn.step3')}</li>
                    </ol>
                    <p className="mt-4 text-sm text-gray-500">{t('mcp.signIn.accountNotice')}</p>
                </div>

                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('mcp.scopes.title')}</h2>
                    <p className="text-sm text-gray-600 mb-4">{t('mcp.scopes.summary')}</p>
                    <dl className="space-y-3">
                        {scopeRows.map((row) => (
                            <div key={row.scope} className="sm:flex sm:gap-4">
                                <dt className="font-mono text-sm text-gray-900 sm:w-40 sm:shrink-0">{row.scope}</dt>
                                <dd className="text-sm text-gray-600">{row.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('mcp.session.title')}</h2>
                    <p className="text-sm text-gray-600">{t('mcp.session.expiry')}</p>
                    <p className="mt-3 text-sm text-gray-600">{t('mcp.session.revoke')}</p>
                </div>

                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5 space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('mcp.connection.skillInstall.title')}</h2>
                    <p className="text-sm text-gray-600">{t('mcp.connection.skillInstall.summary')}</p>
                    <CopyableCodeBlock
                        code={skillInstallPrompt}
                        copied={copiedSection === 'skillInstall'}
                        onCopy={() => void copySection('skillInstall', skillInstallPrompt)}
                        copyLabel={t('common.copy')}
                        copiedLabel={t('common.copied')}
                        preClassName="whitespace-pre-wrap break-words"
                    />
                </div>
            </div>
        </main>
    );
}
