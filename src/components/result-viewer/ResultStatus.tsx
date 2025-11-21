import { useState } from 'react';
import { TestStatus } from '@/types';

interface ResultStatusProps {
    status: TestStatus;
    error?: string;
    eventCount: number;
}

export default function ResultStatus({ status, error, eventCount }: ResultStatusProps) {
    const [copied, setCopied] = useState(false);

    const copyErrorToClipboard = async (errorText: string) => {
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy error:', err);
        }
    };

    if (status === 'PASS') {
        return (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-green-900">Test Passed</h3>
                        <p className="text-sm text-green-700 leading-relaxed">
                            All test steps completed successfully without errors.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'CANCELLED') {
        return (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">Test Cancelled</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {eventCount > 0
                                ? "The test was stopped before completion. Partial results have been saved to history."
                                : "The test was stopped before any results were captured."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'FAIL') {
        return (
            <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-red-900">Test Failed</h3>
                            {error && (
                                <button
                                    onClick={() => copyErrorToClipboard(error)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-md transition-colors"
                                    title="Copy error to clipboard"
                                >
                                    {copied ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Copy Error</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        {error ? (
                            <div className="space-y-1">
                                <p className="text-xs text-red-700 font-medium">Error Details:</p>
                                <p className="text-sm text-red-800 leading-relaxed bg-red-100 p-3 rounded-md border border-red-200 break-words whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {error}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-red-700 leading-relaxed">
                                The test encountered an error during execution. Check the logs above for details.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
