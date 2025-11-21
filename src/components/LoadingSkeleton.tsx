'use client';

interface LoadingSkeletonProps {
    variant?: 'card' | 'table' | 'detail';
    count?: number;
}

export default function LoadingSkeleton({ variant = 'card', count = 3 }: LoadingSkeletonProps) {
    if (variant === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse"
                    >
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50">
                    <div className="col-span-5 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-3 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-2 h-4 bg-gray-200 rounded"></div>
                    <div className="col-span-2 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="divide-y divide-gray-100 animate-pulse">
                    {Array.from({ length: count }).map((_, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center">
                            <div className="col-span-5 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                            </div>
                            <div className="col-span-3">
                                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                            </div>
                            <div className="col-span-2">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'detail') {
        return (
            <div className="animate-pulse space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
