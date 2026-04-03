export declare const SPEC_WORKFLOW_SHARED_ROOT_ENV = "SPEC_WORKFLOW_SHARED_ROOT";
/**
 * Resolves the git workspace root directory.
 * For repositories and worktrees, this returns the top-level checked-out directory.
 *
 * @param projectPath - Any path inside the workspace
 * @returns Workspace root path, or original path when git is unavailable
 */
export declare function resolveGitWorkspaceRoot(projectPath: string): string;
/**
 * Resolves the git root directory for storing shared specs.
 * In worktrees, this returns the main repository path so all worktrees share specs.
 *
 * @param projectPath - The current project/worktree path
 * @returns The resolved path (main repo for worktrees, or original path)
 */
export declare function resolveGitRoot(projectPath: string): string;
/**
 * Checks if the current directory is a git worktree (not the main repo).
 *
 * @param projectPath - The path to check
 * @returns true if in a worktree, false if main repo or not a git repo
 */
export declare function isGitWorktree(projectPath: string): boolean;
//# sourceMappingURL=git-utils.d.ts.map