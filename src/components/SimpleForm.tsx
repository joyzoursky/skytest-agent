'use client';

import { useI18n } from '@/i18n';

interface SimpleFormProps {
    url: string;
    setUrl: (value: string) => void;
    username: string;
    setUsername: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
    prompt: string;
    setPrompt: (value: string) => void;
    readOnly?: boolean;
}

export default function SimpleForm({
    url,
    setUrl,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    prompt,
    setPrompt,
    readOnly
}: SimpleFormProps) {
    const { t } = useI18n();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Target URL */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    {t('simpleForm.targetUrl')}
                </label>
                <input
                    type="url"
                    required
                    className="input-field"
                    placeholder={t('simpleForm.urlPlaceholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={readOnly}
                />
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                        {t('simpleForm.username')} <span className="text-gray-400 font-normal">{t('simpleForm.optional')}</span>
                    </label>
                    <input
                        type="text"
                        className="input-field"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={readOnly}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                        {t('simpleForm.password')} <span className="text-gray-400 font-normal">{t('simpleForm.optional')}</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`input-field pr-10 ${!showPassword ? 'text-security-disc' : ''}`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="off"
                            data-1p-ignore
                            disabled={readOnly}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={readOnly}
                        >
                            {showPassword ? t('common.hide') : t('common.show')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    {t('simpleForm.instructions')}
                </label>
                <textarea
                    required
                    className="input-field min-h-[200px] resize-y"
                    placeholder={t('simpleForm.instructionsPlaceholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={readOnly}
                />
            </div>
        </div>
    );
}

export type { SimpleFormProps };
