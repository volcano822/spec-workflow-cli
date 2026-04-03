export interface PhaseStatus {
    exists: boolean;
    lastModified?: string;
    content?: string;
}
export interface TaskProgress {
    total: number;
    completed: number;
    inProgress: number;
}
export interface SpecData {
    name: string;
    createdAt: string;
    lastModified: string;
    phases: {
        requirements: PhaseStatus;
        design: PhaseStatus;
        tasks: PhaseStatus;
        implementation: {
            exists: boolean;
        };
    };
    taskProgress?: TaskProgress;
}
export interface SteeringStatus {
    exists: boolean;
    documents: {
        product: boolean;
        tech: boolean;
        structure: boolean;
    };
    lastModified?: string;
}
export declare class SpecParser {
    private projectPath;
    constructor(projectPath: string);
    getAllSpecs(): Promise<SpecData[]>;
    getSpec(name: string): Promise<SpecData | null>;
    getProjectSteeringStatus(): Promise<SteeringStatus>;
    private getPhaseStatus;
    private fileExists;
}
//# sourceMappingURL=parser.d.ts.map