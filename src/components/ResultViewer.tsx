'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { TestRun } from '@/types';
import TimelineEvent from './result-viewer/TimelineEvent';
import ResultStatus from './result-viewer/ResultStatus';

interface ResultViewerProps {
    result: Omit<TestRun, 'id' | 'testCaseId' | 'createdAt'> & { events: any[] };
}

export default function ResultViewer({ result }: ResultViewerProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null);

    useEffect(() => {
        if (!autoScroll || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 150;

        if (isNearBottom || result.events.length === 0) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }, [result.events, autoScroll]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 150;

        // Enable auto-scroll when user scrolls near bottom, disable when scrolling up
        if (isNearBottom && !autoScroll) {
            setAutoScroll(true);
        } else if (!isNearBottom && autoScroll) {
            setAutoScroll(false);
        }
    };

    const scrollToBottom = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
        setAutoScroll(true);
    };

    return (
        <>
            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90 animate-fade-in"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
                        aria-label="Close lightbox"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="max-w-7xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={lightboxImage.src}
                            alt={lightboxImage.label}
                            width={1920}
                            height={1080}
                            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh' }}
                            className="rounded-lg"
                        />
                        <p className="text-white text-center mt-4">{lightboxImage.label}</p>
                    </div>
                </div>
            )}

            <div className="glass-panel h-full max-h-[800px] flex flex-col relative">
                {/* Auto-scroll indicator */}
                {!autoScroll && result.status === 'RUNNING' && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-8 right-8 z-50 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-md shadow-lg flex items-center gap-2 font-medium text-sm transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span>New Activity</span>
                    </button>
                )}

                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-foreground">Test Results</h2>
                        {result.status !== 'IDLE' && (
                            <div className={`status-badge ${result.status === 'PASS' ? 'status-badge-pass' :
                                result.status === 'FAIL' ? 'status-badge-fail' :
                                    result.status === 'CANCELLED' ? 'status-badge-cancelled' :
                                        'status-badge-running'
                                }`}>
                                {result.status === 'PASS' && '✓'}
                                {result.status === 'FAIL' && '✕'}
                                {result.status === 'CANCELLED' && '⏹'}
                                <span>{result.status}</span>
                            </div>
                        )}
                    </div>
                    <div className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md">
                        <span className="text-xs text-muted-foreground font-medium">
                            {result.events.length} events
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-5 space-y-4"
                >
                    {result.status === 'IDLE' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <p className="text-base font-medium text-foreground">Ready to Run</p>
                                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                                    Configure your test parameters and click Run Test to begin
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 relative">
                            {result.events.map((event, index) => (
                                <TimelineEvent
                                    key={index}
                                    event={event}
                                    isLast={index === result.events.length - 1}
                                    onImageClick={(src, label) => setLightboxImage({ src, label })}
                                />
                            ))}

                            {/* Running Indicator */}
                            {result.status === 'RUNNING' && (
                                <div className="relative pl-6 flex items-center gap-2">
                                    <div className="timeline-dot bg-blue-500 animate-pulse" />
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                                        <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-sm text-blue-700 font-medium">Running test...</span>
                                    </div>
                                </div>
                            )}

                            <ResultStatus
                                status={result.status}
                                error={result.error}
                                eventCount={result.events.length}
                            />

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
