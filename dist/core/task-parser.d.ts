/**
 * Unified Task Parser Module
 * Provides consistent task parsing across all components
 */
export interface PromptSection {
    key: string;
    value: string;
}
export interface ParsedTask {
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    lineNumber: number;
    indentLevel: number;
    isHeader: boolean;
    requirements?: string[];
    leverage?: string;
    files?: string[];
    purposes?: string[];
    implementationDetails?: string[];
    prompt?: string;
    promptStructured?: PromptSection[];
    completed: boolean;
    inProgress: boolean;
}
export interface TaskParserResult {
    tasks: ParsedTask[];
    inProgressTask: string | null;
    summary: {
        total: number;
        completed: number;
        inProgress: number;
        pending: number;
        headers: number;
    };
}
/**
 * Parse tasks from markdown content
 * Handles any checkbox format at any indentation level
 */
export declare function parseTasksFromMarkdown(content: string): TaskParserResult;
/**
 * Update task status in markdown content
 * Handles any indentation level and task numbering format
 */
export declare function updateTaskStatus(content: string, taskId: string, newStatus: 'pending' | 'in-progress' | 'completed'): string;
/**
 * Find the next pending task that is not a header
 */
export declare function findNextPendingTask(tasks: ParsedTask[]): ParsedTask | null;
/**
 * Get task by ID
 */
export declare function getTaskById(tasks: ParsedTask[], taskId: string): ParsedTask | undefined;
/**
 * Export for backward compatibility with existing code
 */
export declare function parseTaskProgress(content: string): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
};
//# sourceMappingURL=task-parser.d.ts.map