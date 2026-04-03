import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { PathUtils } from './path-utils.js';
import { parseTaskProgress } from './task-parser.js';
export class SpecParser {
    projectPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async getAllSpecs() {
        const specs = [];
        const specsPath = PathUtils.getSpecPath(this.projectPath, '');
        try {
            const entries = await readdir(specsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const spec = await this.getSpec(entry.name);
                    if (spec) {
                        specs.push(spec);
                    }
                }
            }
        }
        catch (error) {
            return [];
        }
        return specs;
    }
    async getSpec(name) {
        const specPath = PathUtils.getSpecPath(this.projectPath, name);
        try {
            const stats = await stat(specPath);
            if (!stats.isDirectory()) {
                return null;
            }
            const requirements = await this.getPhaseStatus(specPath, 'requirements.md');
            const design = await this.getPhaseStatus(specPath, 'design.md');
            const tasks = await this.getPhaseStatus(specPath, 'tasks.md');
            let taskProgress = undefined;
            if (tasks.exists) {
                try {
                    const tasksContent = await readFile(join(specPath, 'tasks.md'), 'utf-8');
                    taskProgress = parseTaskProgress(tasksContent);
                }
                catch {
                }
            }
            return {
                name,
                createdAt: stats.birthtime.toISOString(),
                lastModified: stats.mtime.toISOString(),
                phases: {
                    requirements,
                    design,
                    tasks,
                    implementation: {
                        exists: taskProgress ? taskProgress.completed > 0 : false
                    }
                },
                taskProgress
            };
        }
        catch (error) {
            return null;
        }
    }
    async getProjectSteeringStatus() {
        const steeringPath = PathUtils.getSteeringPath(this.projectPath);
        try {
            const stats = await stat(steeringPath);
            const productExists = await this.fileExists(join(steeringPath, 'product.md'));
            const techExists = await this.fileExists(join(steeringPath, 'tech.md'));
            const structureExists = await this.fileExists(join(steeringPath, 'structure.md'));
            return {
                exists: stats.isDirectory(),
                documents: {
                    product: productExists,
                    tech: techExists,
                    structure: structureExists
                },
                lastModified: stats.mtime.toISOString()
            };
        }
        catch (error) {
            return {
                exists: false,
                documents: {
                    product: false,
                    tech: false,
                    structure: false
                }
            };
        }
    }
    async getPhaseStatus(basePath, filename) {
        const filePath = join(basePath, filename);
        try {
            const stats = await stat(filePath);
            const content = await readFile(filePath, 'utf-8');
            return {
                exists: true,
                lastModified: stats.mtime.toISOString(),
                content
            };
        }
        catch (error) {
            return {
                exists: false
            };
        }
    }
    async fileExists(filePath) {
        try {
            await stat(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=parser.js.map