'use client';

import { TestCaseFile } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface StepFileSelectorProps {
    availableFiles: TestCaseFile[];
    selectedFileIds: string[];
    onChange: (fileIds: string[]) => void;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function StepFileSelector({
    availableFiles,
    selectedFileIds,
    onChange,
    disabled,
    onOpenChange
}: StepFileSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    const selectedFiles = availableFiles.filter(f => selectedFileIds.includes(f.id));
    const unselectedFiles = availableFiles.filter(f => !selectedFileIds.includes(f.id));

    const handleToggleFile = (fileId: string) => {
        if (selectedFileIds.includes(fileId)) {
            onChange(selectedFileIds.filter(id => id !== fileId));
        } else {
            onChange([...selectedFileIds, fileId]);
        }
    };

    const handleRemoveFile = (fileId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedFileIds.filter(id => id !== fileId));
    };

    if (availableFiles.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                Files for Upload Action
            </label>

            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50 rounded-lg border border-gray-200">
                {selectedFiles.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className="text-xs font-sans text-gray-400 hover:text-indigo-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Attach uploaded files
                    </button>
                ) : (
                    <>
                        {selectedFiles.map(file => (
                            <span
                                key={file.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {file.filename}
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveFile(file.id, e)}
                                        className="ml-0.5 hover:text-red-600"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </span>
                        ))}
                        {!disabled && unselectedFiles.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-xs font-sans text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </>
                )}
            </div>

            {isOpen && unselectedFiles.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {unselectedFiles.map(file => (
                        <button
                            key={file.id}
                            type="button"
                            onClick={() => handleToggleFile(file.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate">{file.filename}</span>
                        </button>
                    ))}
                </div>
            )}

            {selectedFiles.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                    These files will be provided to the browser&apos;s file chooser dialog
                </p>
            )}
        </div>
    );
}
