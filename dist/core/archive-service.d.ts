export declare class SpecArchiveService {
    private projectPath;
    constructor(projectPath: string);
    archiveSpec(specName: string): Promise<void>;
    unarchiveSpec(specName: string): Promise<void>;
    isSpecActive(specName: string): Promise<boolean>;
    isSpecArchived(specName: string): Promise<boolean>;
    getSpecLocation(specName: string): Promise<'active' | 'archived' | 'not-found'>;
}
//# sourceMappingURL=archive-service.d.ts.map