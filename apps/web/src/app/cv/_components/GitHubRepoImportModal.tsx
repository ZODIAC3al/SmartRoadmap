import React, { useEffect, useState } from 'react';
import { getGitHubRepos, GitHubRepo } from '@/lib/profileImport';
import { CloseIcon, SparklesIcon } from './icons';

interface GitHubRepoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProjects: (repos: GitHubRepo[]) => void;
}

export const GitHubRepoImportModal: React.FC<GitHubRepoImportModalProps> = ({
  isOpen,
  onClose,
  onImportProjects,
}) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
      getGitHubRepos()
        .then((res) => {
          if (res.repos && Array.isArray(res.repos)) {
            setRepos(res.repos);
            // Default select top 3 starred/updated repos
            setSelectedIds(res.repos.slice(0, 3).map((r) => r.id));
          }
        })
        .catch((err) => {
          setError('Failed to load GitHub repositories. Make sure your GitHub account is connected in Profile.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selected = repos.filter((r) => selectedIds.includes(r.id));
    onImportProjects(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="card w-full max-w-xl bg-base-200 border border-base-300 text-base-content p-6 rounded-2xl shadow-2xl relative text-start animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-circle btn-xs btn-ghost text-stone-700 dark:text-stone-300 font-medium"
        >
          <CloseIcon />
        </button>

        <div className="flex items-center gap-3 border-b border-base-300 pb-4 mb-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
            💻
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight">Import Projects from GitHub</h3>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium mt-0.5">
              Select repositories from your connected GitHub account to include in your CV.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">Fetching your GitHub repositories...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error text-xs rounded-xl my-4 font-semibold">
            <span>⚠️ {error}</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-bold">No repositories found.</p>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              Connect your GitHub account in Profile Settings to import your repositories.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {repos.map((repo) => {
                const isSelected = selectedIds.includes(repo.id);
                return (
                  <div
                    key={repo.id}
                    onClick={() => toggleSelect(repo.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-base-100 border-base-300 hover:border-base-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="checkbox checkbox-primary checkbox-xs mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-base-content">{repo.name}</span>
                          {repo.language && (
                            <span className="badge badge-ghost text-[9px] font-mono font-bold">
                              {repo.language}
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium line-clamp-2 mt-1">
                            {repo.description}
                          </p>
                        )}
                        {repo.topics && repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {repo.topics.slice(0, 4).map((topic, i) => (
                              <span key={i} className="text-[8px] bg-base-300/60 text-stone-700 dark:text-stone-300 font-medium px-1.5 py-0.5 rounded font-mono">
                                #{topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-700 dark:text-stone-300 font-medium font-mono flex items-center gap-1 shrink-0">
                      ⭐ {repo.stargazers_count || 0}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-base-300">
              <span className="text-xs text-stone-700 dark:text-stone-300 font-medium font-semibold">
                {selectedIds.length} repository selected
              </span>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn btn-xs sm:btn-sm btn-ghost rounded-lg font-bold">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedIds.length === 0}
                  className="btn btn-xs sm:btn-sm bg-primary hover:bg-[#8E1616] text-white border-none rounded-lg font-bold px-4"
                >
                  Import Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
