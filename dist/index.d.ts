#!/usr/bin/env node
interface ParsedArgs {
    command: string;
    subCommands: string[];
    workspacePath: string;
    workflowRootPath: string;
    expandedPath: string;
    noSharedWorktreeSpecs: boolean;
    options: {
        status?: string;
        yes?: boolean;
        message?: string;
        reason?: string;
        lines?: number;
        follow?: boolean;
        key?: string;
        value?: string;
    };
}
export declare function parseArguments(args: string[]): ParsedArgs;
export declare function resolveEntrypoint(pathValue: string | undefined): string | undefined;
export {};
//# sourceMappingURL=index.d.ts.map