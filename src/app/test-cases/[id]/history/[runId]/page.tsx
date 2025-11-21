"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "../../../../auth-provider";
import { useRouter } from "next/navigation";
import ResultViewer from "@/components/ResultViewer";
import TestForm from "@/components/TestForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDateTime } from "@/utils/dateFormatter";

interface TestRun {
    id: string;
    status: 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL';
    createdAt: string;
    result: string;
    error: string | null;
}

interface TestCase {
    id: string;
    name: string;
    url: string;
    prompt: string;
    username?: string;
    password?: string;
}

export default function RunDetailPage({ params }: { params: Promise<{ id: string; runId: string }> }) {
    const { id, runId } = use(params);
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [testRun, setTestRun] = useState<TestRun | null>(null);
    const [testCase, setTestCase] = useState<TestCase | null>(null);
    const [projectId, setProjectId] = useState<string>("");
    const [projectName, setProjectName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push("/");
        }
    }, [isAuthLoading, isLoggedIn, router]);

    useEffect(() => {
        fetchRunDetails();
        fetchTestCase();
    }, [runId, id]);

    const fetchTestCase = async () => {
        try {
            const response = await fetch(`/api/test-cases/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTestCase(data);
                setProjectId(data.projectId);
                // Fetch project name
                const projectResponse = await fetch(`/api/projects/${data.projectId}`);
                if (projectResponse.ok) {
                    const projectData = await projectResponse.json();
                    setProjectName(projectData.name);
                }
            }
        } catch (error) {
            console.error("Failed to fetch test case", error);
        }
    };

    const fetchRunDetails = async () => {
        try {
            const response = await fetch(`/api/test-cases/${id}/history`);
            if (response.ok) {
                const data = await response.json();
                const run = data.find((r: TestRun) => r.id === runId);
                if (run) {
                    setTestRun(run);
                }
            }
        } catch (error) {
            console.error("Failed to fetch run details", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!testRun) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Test run not found.</p>
            </div>
        );
    }

    const events = testRun.result ? JSON.parse(testRun.result) : [];

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <Breadcrumbs items={[
                    { label: projectName, href: projectId ? `/projects/${projectId}` : undefined },
                    { label: testCase?.name || "Test Case", href: `/test-cases/${id}/history` },
                    { label: `Run - ${formatDateTime(testRun.createdAt)}` }
                ]} />

                <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Run Details</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Test Form Snapshot */}
                    <div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
                            {testCase && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Case Name</label>
                                        <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900 border border-gray-200">
                                            {testCase.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                                        <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900 border border-gray-200 break-all">
                                            {testCase.url}
                                        </div>
                                    </div>
                                    {testCase.username && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                            <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900 border border-gray-200">
                                                {testCase.username}
                                            </div>
                                        </div>
                                    )}
                                    {testCase.password && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                            <div className="relative">
                                                <div className={`px-4 py-2 bg-gray-50 rounded-md text-gray-900 border border-gray-200 pr-10 ${!showPassword ? 'text-security-disc' : ''}`}>
                                                    {testCase.password}
                                                </div>
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
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Instructions</label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-md text-gray-900 border border-gray-200 whitespace-pre-wrap min-h-[120px]">
                                            {testCase.prompt}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Test Results */}
                    <div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
                            <ResultViewer result={{ status: testRun.status, events, error: testRun.error || undefined }} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
