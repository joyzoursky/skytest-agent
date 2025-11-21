import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { API_ENDPOINTS } from '@/lib/constants';

export function useProjects(userId: string) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_ENDPOINTS.PROJECTS}?userId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const data = await response.json();
            setProjects(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const refresh = () => {
        fetchProjects();
    };

    const addProject = (newProject: Project) => {
        setProjects(prev => [newProject, ...prev]);
    };

    const removeProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const updateProject = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    };

    return { projects, loading, error, refresh, addProject, removeProject, updateProject };
}
