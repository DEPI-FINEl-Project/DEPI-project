import { useCallback, useState } from 'react';
import { generateAboutMe, improveProjectDescription } from '../ai.js';

// Custom hook: wraps the AI service so components stay declarative.
// Tracks which action is in flight (by key) and surfaces a single error
// message, instead of every caller re-implementing try/catch + loading state.
export function useAIAssist() {
  const [loadingKey, setLoadingKey] = useState(null); // e.g. 'about' or `project-2`
  const [error, setError] = useState('');

  const run = useCallback(async (key, task) => {
    setError('');
    setLoadingKey(key);
    try {
      return await task();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      return null;
    } finally {
      setLoadingKey(null);
    }
  }, []);

  const improveDescription = useCallback(
    (index, project, context) => run(`project-${index}`, () => improveProjectDescription(project, context)),
    [run]
  );

  const improveAbout = useCallback(
    (profile) => run('about', () => generateAboutMe(profile)),
    [run]
  );

  return {
    isLoading: (key) => loadingKey === key,
    error,
    improveDescription,
    improveAbout
  };
}
