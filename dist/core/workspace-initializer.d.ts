export declare class WorkspaceInitializer {
    private projectPath;
    private version;
    constructor(projectPath: string, version: string);
    initializeWorkspace(): Promise<void>;
    private initializeDirectories;
    private initializeTemplates;
    private copyTemplate;
    private createUserTemplatesReadme;
}
//# sourceMappingURL=workspace-initializer.d.ts.map