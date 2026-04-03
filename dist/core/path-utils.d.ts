export declare class PathUtils {
    /** macOS and Windows are case-insensitive filesystems */
    private static readonly IS_CASE_INSENSITIVE;
    /** Cached path configuration (undefined = not checked, null = invalid/missing) */
    private static pathConfig;
    /**
     * Get cached path configuration from environment variables.
     * Caches result to prevent race conditions from env var changes mid-operation.
     */
    private static getPathConfig;
    /** Check if path is absolute (Unix or Windows style) */
    private static isAbsolutePath;
    /** Reset cached config (for testing) */
    static resetPathConfig(): void;
    /**
     * Normalize path for cross-platform comparison using built-in path.posix.
     * Converts backslashes to forward slashes, removes trailing slashes.
     */
    private static normalizeForComparison;
    /**
     * Check if a path matches a prefix with proper boundary checking.
     * - Prevents partial matches like "/Users/dev" matching "/Users/developer"
     * - Handles case-insensitivity on macOS/Windows
     * - Normalizes path separators for cross-platform support
     */
    private static pathMatchesPrefix;
    /**
     * Translate a host path to container path if running in Docker with path mapping configured.
     *
     * Environment variables:
     * - SPEC_WORKFLOW_HOST_PATH_PREFIX: Path prefix on the host (e.g., /Users/username)
     * - SPEC_WORKFLOW_CONTAINER_PATH_PREFIX: Corresponding path in container (e.g., /projects)
     *
     * Example: If host prefix is "/Users/dev" and container prefix is "/projects",
     * then "/Users/dev/myapp" becomes "/projects/myapp"
     */
    static translatePath(hostPath: string): string;
    /**
     * Reverse translation: container path back to host path (for display/registry)
     */
    static reverseTranslatePath(containerPath: string): string;
    /**
     * Validate that a resolved absolute path is within at least one of the given base directories.
     * Throws if the path escapes all bases.
     */
    static validatePathWithinBases(resolvedPath: string, basePaths: string[]): void;
    /**
     * Safely join paths ensuring no directory traversal
     */
    static safeJoin(basePath: string, ...paths: string[]): string;
    static getWorkflowRoot(projectPath: string): string;
    static getSpecPath(projectPath: string, specName: string): string;
    static getArchiveSpecPath(projectPath: string, specName: string): string;
    static getArchiveSpecsPath(projectPath: string): string;
    static getSteeringPath(projectPath: string): string;
    static getTemplatesPath(projectPath: string): string;
    static getAgentsPath(projectPath: string): string;
    static getCommandsPath(projectPath: string): string;
    static getApprovalsPath(projectPath: string): string;
    static getSpecApprovalPath(projectPath: string, specName: string): string;
    static toPlatformPath(path: string): string;
    static toUnixPath(path: string): string;
    static getRelativePath(projectPath: string, fullPath: string): string;
}
export declare function validateProjectPath(projectPath: string): Promise<string>;
export declare function ensureDirectoryExists(dirPath: string): Promise<void>;
export declare function ensureWorkflowDirectory(projectPath: string): Promise<string>;
//# sourceMappingURL=path-utils.d.ts.map