"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../auth-provider";
import TestForm from "@/components/TestForm";
import ResultViewer from "@/components/ResultViewer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TestStep, BrowserConfig, TestEvent } from "@/types";

interface TestData {
    url: string;
    username?: string;
    password?: string;
    prompt: string;
    name?: string;
    steps?: TestStep[];
    browserConfig?: Record<string, BrowserConfig>;
}

interface TestResult {
    status: 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL' | 'CANCELLED';
    events: TestEvent[];
    error?: string;
}

function RunPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TestResult>({
        status: 'IDLE',
        events: [],
    });
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [currentTestCaseId, setCurrentTestCaseId] = useState<string | null>(null);
    const [projectIdFromTestCase, setProjectIdFromTestCase] = useState<string | null>(null);
    const [projectName, setProjectName] = useState<string>('');

    const projectId = searchParams.get("projectId");
    const testCaseId = searchParams.get("testCaseId");
    const testCaseName = searchParams.get("name");
    const [initialData, setInitialData] = useState<TestData | undefined>(undefined);
    const [originalName, setOriginalName] = useState<string | null>(null);
    const [originalMode, setOriginalMode] = useState<'simple' | 'builder' | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push("/");
        }
    }, [isAuthLoading, isLoggedIn, router]);

    useEffect(() => {
        // Fetch project name if projectId is in URL
        if (projectId) {
            fetchProjectName(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        // Fetch project name if we got projectId from test case
        if (projectIdFromTestCase && !projectId) {
            fetchProjectName(projectIdFromTestCase);
        }
    }, [projectIdFromTestCase, projectId]);

    // Prevent navigation away from page during active test
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (result.status === 'RUNNING') {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [result.status]);

    useEffect(() => {
        if (testCaseId) {
            fetchTestCase(testCaseId);
        } else if (testCaseName) {
            // Pre-fill just the name for new runs from test case page
            setInitialData({ name: testCaseName, url: '', prompt: '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testCaseId, testCaseName]);

    const fetchTestCase = async (id: string) => {
        try {
            const response = await fetch(`/api/test-cases/${id}`);
            if (response.ok) {
                const data = await response.json();
                const hasSteps = data.steps && data.steps.length > 0;
                const hasBrowserConfig = data.browserConfig && Object.keys(data.browserConfig).length > 0;
                const mode = (hasSteps || hasBrowserConfig) ? 'builder' : 'simple';

                setInitialData({
                    name: data.name,
                    url: data.url,
                    prompt: data.prompt,
                    username: data.username || "",
                    password: data.password || "",
                    steps: data.steps,
                    browserConfig: data.browserConfig,
                });

                // Store original values to detect changes
                setOriginalName(data.name);
                setOriginalMode(mode);

                // Store the projectId from the test case for back navigation
                setProjectIdFromTestCase(data.projectId);
                // Fetch project name for breadcrumb
                fetchProjectName(data.projectId);
            }
        } catch (error) {
            console.error("Failed to fetch test case", error);
        }
    };

    const fetchProjectName = async (projId: string) => {
        try {
            const response = await fetch(`/api/projects/${projId}`);
            if (response.ok) {
                const data = await response.json();
                setProjectName(data.name);
            }
        } catch (error) {
            console.error("Failed to fetch project name", error);
        }
    };

    const handleStopTest = async () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
    };

    const eventsRef = useRef<TestEvent[]>([]);

    const handleRunTest = async (data: TestData) => {
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);
        // Reset events ref
        eventsRef.current = [];

        setResult({
            status: 'RUNNING',
            events: [],
        });

        let activeTestCaseId = testCaseId;

        // Detect current mode from the data
        const hasSteps = data.steps && data.steps.length > 0;
        const hasBrowserConfig = data.browserConfig && Object.keys(data.browserConfig).length > 0;
        const currentMode = (hasSteps || hasBrowserConfig) ? 'builder' : 'simple';

        // Check if name or mode has changed - if so, create a new test case
        const nameChanged = originalName && data.name && data.name !== originalName;
        const modeChanged = originalMode && currentMode !== originalMode;
        const shouldCreateNew = nameChanged || modeChanged;

        // 1. Create or Update Test Case (ALWAYS do this before running the test)
        try {
            if (activeTestCaseId && !shouldCreateNew) {
                // Update existing test case (only if name and mode haven't changed)
                const updateResponse = await fetch(`/api/test-cases/${activeTestCaseId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!updateResponse.ok) {
                    console.error("Failed to update test case");
                }
            } else if ((activeTestCaseId && shouldCreateNew) || (!activeTestCaseId && projectId && data.name)) {
                // Create new test case if:
                // 1. Editing existing but name/mode changed, OR
                // 2. Creating completely new test case
                const effectiveProjectId = projectId || projectIdFromTestCase;
                if (effectiveProjectId) {
                    const response = await fetch(`/api/projects/${effectiveProjectId}/test-cases`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    });
                    if (response.ok) {
                        const newTestCase = await response.json();
                        activeTestCaseId = newTestCase.id;
                        setCurrentTestCaseId(activeTestCaseId);
                        // Update URL without reload so we can save to this test case even if cancelled
                        window.history.replaceState(null, "", `?testCaseId=${activeTestCaseId}&projectId=${effectiveProjectId}`);
                        // Update original values to prevent duplicate creation
                        setOriginalName(data.name || null);
                        setOriginalMode(currentMode);
                    } else {
                        // If we can't create the test case, don't continue
                        const errorText = await response.text();
                        console.error("Failed to create test case:", errorText);
                        setResult({ status: 'FAIL', events: [], error: `Failed to create test case: ${response.statusText}` });
                        setIsLoading(false);
                        return;
                    }
                }
            }
            // If no projectId and no testCaseId, we can't save the test, but allow it to run anyway
        } catch (error) {
            console.error("Failed to save test case", error);
            setResult({ status: 'FAIL', events: [], error: `Failed to save test case: ${error instanceof Error ? error.message : 'Unknown error'}` });
            setIsLoading(false);
            return;
        }

        // 2. Run Test
        try {
            const response = await fetch('/api/run-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let finalStatus: string | null = null;
            let finalEvents: TestEvent[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const eventData = JSON.parse(line.slice(6));

                            setResult(prev => {
                                const newEvents = [...prev.events];
                                if (eventData.type === 'log' || eventData.type === 'screenshot') {
                                    const event = { ...eventData, timestamp: Date.now() };
                                    newEvents.push(event);
                                    // Update ref
                                    eventsRef.current = newEvents;
                                } else if (eventData.type === 'status') {
                                    finalStatus = eventData.status;
                                    return { ...prev, status: eventData.status, error: eventData.error };
                                }
                                finalEvents = newEvents;
                                return { ...prev, events: newEvents };
                            });
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

            // Check if we finished without a final status
            if (!finalStatus) {
                // Stream ended but we didn't get a status event.
                // This usually means timeout or server crash.
                finalStatus = 'FAIL';
                const errorMsg = 'Test run terminated unexpectedly (possibly timed out)';
                setResult(prev => ({ ...prev, status: 'FAIL', error: errorMsg }));
            }

            // 3. Save Test Run Result with test configuration snapshot
            if (activeTestCaseId) {
                await fetch(`/api/test-cases/${activeTestCaseId}/run`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: finalStatus,
                        result: finalEvents,
                        error: result.error,
                        testConfig: data, // Save the test configuration that was actually run
                    }),
                });
            }

        } catch (error: unknown) {
            // Check if error is due to abort
            if (error instanceof Error && error.name === 'AbortError') {
                const cancelledEvents = eventsRef.current;
                setResult({ status: 'CANCELLED', events: cancelledEvents, error: 'Test was cancelled by user' });

                // Save cancelled run with partial results
                if (activeTestCaseId) {
                    await fetch(`/api/test-cases/${activeTestCaseId}/run`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: 'CANCELLED',
                            result: cancelledEvents,
                            error: 'Test was cancelled by user',
                            testConfig: data, // Save the test configuration that was run
                        }),
                    }).catch(err => console.error('Failed to save cancelled run:', err));
                }
            } else {
                const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                setResult(prev => ({ ...prev, status: 'FAIL', error: errorMessage }));

                // Save failed run
                if (activeTestCaseId) {
                    await fetch(`/api/test-cases/${activeTestCaseId}/run`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: 'FAIL',
                            result: [],
                            error: errorMessage,
                            testConfig: data, // Save the test configuration that was run
                        }),
                    });
                }
            }
        } finally {
            setIsLoading(false);
        }
    };



    if (isAuthLoading) return null;

    return (
        <>
            {(projectId || projectIdFromTestCase) && projectName && (
                <Breadcrumbs items={[
                    { label: projectName, href: `/projects/${projectId || projectIdFromTestCase}` },
                    { label: testCaseId ? 'Run Test' : 'New Run' }
                ]} />
            )}

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {testCaseId ? 'Run Test' : 'Start New Run'}
                </h1>
                <div className="flex items-center gap-4">
                    {result.status === 'RUNNING' && (
                        <button
                            onClick={handleStopTest}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                            Stop Test
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <TestForm
                        onSubmit={handleRunTest}
                        isLoading={isLoading}
                        initialData={initialData}
                        showNameInput={true}
                    />
                </div>
                <div className="h-full">
                    <ResultViewer result={result} />
                </div>
            </div>
        </>
    );
}

export default function RunPage() {
    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={<div>Loading...</div>}>
                    <RunPageContent />
                </Suspense>
            </div>
        </main>
    );
}
