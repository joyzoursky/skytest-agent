'use client';

import { useState, useEffect } from 'react';

interface TestData {
    url: string;
    username?: string;
    password?: string;
    prompt: string;
    name?: string;
}

interface TestFormProps {
    onSubmit: (data: TestData) => void;
    isLoading: boolean;
    initialData?: TestData;
    showNameInput?: boolean;
}

export default function TestForm({ onSubmit, isLoading, initialData, showNameInput }: TestFormProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [prompt, setPrompt] = useState('');
    const [showPassword, setShowPassword] = useState(false);


    useEffect(() => {
        if (initialData) {
            if (initialData.name) setName(initialData.name);
            if (initialData.url) setUrl(initialData.url);
            if (initialData.username) setUsername(initialData.username);
            if (initialData.password) setPassword(initialData.password);
            if (initialData.prompt) setPrompt(initialData.prompt);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name: showNameInput ? name : undefined, url, username, password, prompt });
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel h-[800px] p-6 space-y-6 flex flex-col">
            {/* Header */}
            <div className="pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-foreground">Test Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure your automated test parameters</p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto">
                {/* Test Case Name */}
                {showNameInput && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Test Case Name
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="e.g. Login and Add to Cart"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                )}

                {/* Target URL */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                        Target URL
                    </label>
                    <input
                        type="url"
                        required
                        className="input-field"
                        placeholder="https://app.example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Username <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Password <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className={`input-field pr-10 ${!showPassword ? 'text-security-disc' : ''}`}
                                placeholder="secret_sauce"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off"
                                data-1p-ignore
                            />
                            {password && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Test Scenario */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                        Test Instructions
                    </label>
                    <textarea
                        required
                        className="input-field min-h-[200px] resize-y"
                        placeholder="Enter step-by-step test instructions, for example:&#10;• Login with the provided credentials&#10;• Navigate to the products page&#10;• Add first item to cart&#10;• Verify cart contains the item"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Provide clear, step-by-step instructions in plain language
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex-shrink-0 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Running Test...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Run Test</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
