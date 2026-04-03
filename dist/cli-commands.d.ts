export declare class SpecWorkflowCLI {
    private projectPath;
    constructor(projectPath: string);
    initWorkspace(): Promise<void>;
    private copyTemplates;
    createSpec(type: 'requirements' | 'design' | 'tasks', name: string): Promise<void>;
    listSpecs(status?: string): Promise<void>;
    getSpecStatus(specId: string): Promise<void>;
    execTask(specId: string, taskId: string, yes?: boolean): Promise<void>;
    approveSpec(specId: string, message?: string): Promise<void>;
    rejectSpec(specId: string, reason: string): Promise<void>;
    viewLogs(specId: string, lines?: number, follow?: boolean): Promise<void>;
    setConfig(key: string, value: string): Promise<void>;
    archiveSpec(specId: string): Promise<void>;
    createTask(specId: string, taskTitle: string, description?: string): Promise<void>;
}
//# sourceMappingURL=cli-commands.d.ts.map