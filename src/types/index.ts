export interface Project {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        testCases: number;
    };
}


export interface BrowserConfig {
    url: string;
    username?: string;
    password?: string;
}

export interface TestStep {
    id: string; // generated client-side or by index
    target: string; // Dynamic browser ID (e.g., 'browser_1')
    action: string;
}

export interface TestCase {
    id: string;
    name: string;
    url: string;
    prompt: string; // Kept for backward compatibility, but UI might prefer steps
    steps?: TestStep[];
    browserConfig?: Record<string, BrowserConfig>;
    projectId: string;
    username?: string;
    password?: string;
    createdAt: string;
    updatedAt: string;
    testRuns?: TestRun[];
}

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL' | 'CANCELLED';

export interface TestRun {
    id: string;
    testCaseId: string;
    status: TestStatus;
    result?: string;
    error?: string;
    createdAt: string;
    events?: TestEvent[];
}

export type TestEventType = 'log' | 'screenshot';
export type LogLevel = 'info' | 'error' | 'success';

export interface LogData {
    message: string;
    level: LogLevel;
}

export interface ScreenshotData {
    src: string;
    label: string;
}

export interface TestEvent {
    type: TestEventType;
    data: LogData | ScreenshotData;
    timestamp: number;
    browserId?: string;
}

// Type guard for LogData
export function isLogData(data: any): data is LogData {
    return data && typeof data.message === 'string' && typeof data.level === 'string';
}

// Type guard for ScreenshotData
export function isScreenshotData(data: any): data is ScreenshotData {
    return data && typeof data.src === 'string';
}
