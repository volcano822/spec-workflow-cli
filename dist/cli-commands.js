import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PathUtils } from './core/path-utils.js';
import { SpecParser } from './core/parser.js';
import { SpecArchiveService } from './core/archive-service.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
export class SpecWorkflowCLI {
    projectPath;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async initWorkspace() {
        const workflowRoot = PathUtils.getWorkflowRoot(this.projectPath);
        const directories = [
            workflowRoot,
            PathUtils.getSpecPath(this.projectPath, ''),
            PathUtils.getArchiveSpecsPath(this.projectPath),
            PathUtils.getSteeringPath(this.projectPath),
            PathUtils.getTemplatesPath(this.projectPath),
            PathUtils.getApprovalsPath(this.projectPath)
        ];
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        await this.copyTemplates();
    }
    async copyTemplates() {
        const templatesDir = PathUtils.getTemplatesPath(this.projectPath);
        const templates = [
            'requirements-template',
            'design-template',
            'tasks-template'
        ];
        for (const template of templates) {
            const sourcePath = join(__dirname, 'markdown', 'templates', `${template}.md`);
            const targetPath = join(templatesDir, `${template}.md`);
            try {
                const content = await fs.readFile(sourcePath, 'utf-8');
                await fs.writeFile(targetPath, content, 'utf-8');
            }
            catch (error) {
                console.error(`Failed to copy template ${template}:`, error);
            }
        }
    }
    async createSpec(type, name) {
        const specPath = PathUtils.getSpecPath(this.projectPath, name);
        await fs.mkdir(specPath, { recursive: true });
        const templateFile = `${type}-template.md`;
        const sourcePath = join(PathUtils.getTemplatesPath(this.projectPath), templateFile);
        const targetPath = join(specPath, `${type}.md`);
        try {
            const content = await fs.readFile(sourcePath, 'utf-8');
            const processedContent = content
                .replace(/{{featureName}}/g, name)
                .replace(/{{date}}/g, new Date().toISOString().split('T')[0]);
            await fs.writeFile(targetPath, processedContent, 'utf-8');
            console.log(`Created ${type} document for spec '${name}' at: ${targetPath}`);
        }
        catch (error) {
            throw new Error(`Failed to create ${type} document: ${error.message}`);
        }
    }
    async listSpecs(status) {
        const parser = new SpecParser(this.projectPath);
        const specs = await parser.getAllSpecs();
        if (specs.length === 0) {
            console.log('No specs found');
            return;
        }
        console.log('\nSpecs:');
        console.log('='.repeat(60));
        for (const spec of specs) {
            const requirementsExists = spec.phases.requirements.exists;
            const designExists = spec.phases.design.exists;
            const tasksExists = spec.phases.tasks.exists;
            const implementationStarted = spec.phases.implementation.exists;
            let displayStatus = 'In Progress';
            if (spec.taskProgress) {
                const { total, completed, inProgress } = spec.taskProgress;
                if (total === 0) {
                    displayStatus = requirementsExists ? (designExists ? (tasksExists ? 'Ready' : 'Designing') : 'Requirements') : 'New';
                }
                else if (completed === total) {
                    displayStatus = 'Complete';
                }
                else if (inProgress > 0) {
                    displayStatus = 'Implementing';
                }
                else if (completed > 0) {
                    displayStatus = 'Partially Complete';
                }
            }
            if (status && displayStatus.toLowerCase() !== status.toLowerCase()) {
                continue;
            }
            console.log(`\n📋 ${spec.name}`);
            console.log(`   Status: ${displayStatus}`);
            console.log(`   Created: ${spec.createdAt}`);
            console.log(`   Last Modified: ${spec.lastModified}`);
            console.log(`   Phases: ${requirementsExists ? '✅' : '⬜'} Requirements  ${designExists ? '✅' : '⬜'} Design  ${tasksExists ? '✅' : '⬜'} Tasks  ${implementationStarted ? '✅' : '⬜'} Implementation`);
            if (spec.taskProgress) {
                const { total, completed, inProgress } = spec.taskProgress;
                const pending = total - completed - inProgress;
                console.log(`   Tasks: ${completed}/${total} completed (${inProgress} in progress, ${pending} pending)`);
            }
        }
        console.log('\n');
    }
    async getSpecStatus(specId) {
        const parser = new SpecParser(this.projectPath);
        const spec = await parser.getSpec(specId);
        if (!spec) {
            throw new Error(`Spec '${specId}' not found`);
        }
        console.log(`\n📊 Status for: ${spec.name}`);
        console.log('='.repeat(60));
        console.log(`Created: ${spec.createdAt}`);
        console.log(`Last Modified: ${spec.lastModified}`);
        console.log('\n📁 Phases:');
        console.log(`   Requirements: ${spec.phases.requirements.exists ? '✅ Exists' : '⬜ Missing'}`);
        if (spec.phases.requirements.exists) {
            console.log(`      Last modified: ${spec.phases.requirements.lastModified}`);
        }
        console.log(`   Design: ${spec.phases.design.exists ? '✅ Exists' : '⬜ Missing'}`);
        if (spec.phases.design.exists) {
            console.log(`      Last modified: ${spec.phases.design.lastModified}`);
        }
        console.log(`   Tasks: ${spec.phases.tasks.exists ? '✅ Exists' : '⬜ Missing'}`);
        if (spec.phases.tasks.exists) {
            console.log(`      Last modified: ${spec.phases.tasks.lastModified}`);
        }
        console.log(`   Implementation: ${spec.phases.implementation.exists ? '✅ Started' : '⬜ Not started'}`);
        if (spec.taskProgress) {
            console.log('\n📋 Task Progress:');
            const { total, completed, inProgress } = spec.taskProgress;
            const pending = total - completed - inProgress;
            const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            console.log(`   Total: ${total}`);
            console.log(`   Completed: ${completed} (${completionPercent}%)`);
            console.log(`   In Progress: ${inProgress}`);
            console.log(`   Pending: ${pending}`);
            if (total > 0) {
                const progressBarLength = 30;
                const completedChars = Math.round((completed / total) * progressBarLength);
                const inProgressChars = Math.round((inProgress / total) * progressBarLength);
                const pendingChars = progressBarLength - completedChars - inProgressChars;
                const progressBar = '[' +
                    '█'.repeat(completedChars) +
                    '▒'.repeat(inProgressChars) +
                    '░'.repeat(pendingChars) +
                    ']';
                console.log(`   ${progressBar} ${completionPercent}%`);
            }
        }
        console.log('\n');
    }
    async execTask(specId, taskId, yes = false) {
        const specPath = PathUtils.getSpecPath(this.projectPath, specId);
        const tasksPath = join(specPath, 'tasks.md');
        try {
            await fs.access(tasksPath);
        }
        catch {
            throw new Error(`Tasks file not found for spec '${specId}' at: ${tasksPath}`);
        }
        if (!yes) {
            console.log(`\n⚠️  Warning: This will execute task ${taskId} for spec '${specId}'`);
            console.log(`Tasks file: ${tasksPath}`);
            console.log('\nNote: This is a placeholder for actual task execution logic.');
            console.log('In a real implementation, this would read the task and execute it.');
            console.log('\nUse --yes to skip this confirmation.\n');
            return;
        }
        console.log(`\n🚀 Executing task ${taskId} for spec '${specId}'...`);
        console.log('(This is a placeholder - actual execution logic would be implemented here)\n');
    }
    async approveSpec(specId, message) {
        console.log(`\n✅ Approving spec '${specId}'...`);
        if (message) {
            console.log(`Message: ${message}`);
        }
        console.log('(This is a placeholder - actual approval logic would be implemented here)\n');
    }
    async rejectSpec(specId, reason) {
        console.log(`\n❌ Rejecting spec '${specId}'...`);
        console.log(`Reason: ${reason}`);
        console.log('(This is a placeholder - actual rejection logic would be implemented here)\n');
    }
    async viewLogs(specId, lines, follow) {
        console.log(`\n📜 Logs for spec '${specId}':`);
        if (lines) {
            console.log(`Showing last ${lines} lines`);
        }
        if (follow) {
            console.log('Following real-time updates');
        }
        console.log('(This is a placeholder - actual log viewing logic would be implemented here)\n');
    }
    async setConfig(key, value) {
        console.log(`\n⚙️  Setting config ${key} = ${value}`);
        console.log('(This is a placeholder - actual config setting logic would be implemented here)\n');
    }
    async archiveSpec(specId) {
        const archiveService = new SpecArchiveService(this.projectPath);
        await archiveService.archiveSpec(specId);
        console.log(`\n📦 Archived spec '${specId}' successfully\n`);
    }
    async createTask(specId, taskTitle, description) {
        const specPath = PathUtils.getSpecPath(this.projectPath, specId);
        const tasksPath = join(specPath, 'tasks.md');
        try {
            // Check if spec exists
            await fs.access(specPath);
        }
        catch {
            throw new Error(`Spec '${specId}' not found`);
        }
        let tasksContent = '';
        try {
            tasksContent = await fs.readFile(tasksPath, 'utf-8');
        }
        catch {
            // Tasks file doesn't exist, create it with template
            const templatePath = join(PathUtils.getTemplatesPath(this.projectPath), 'tasks-template.md');
            try {
                tasksContent = await fs.readFile(templatePath, 'utf-8');
                tasksContent = tasksContent
                    .replace(/{{featureName}}/g, specId)
                    .replace(/{{date}}/g, new Date().toISOString().split('T')[0]);
            }
            catch {
                // If template doesn't exist, create a basic tasks file
                tasksContent = '# Tasks Document\n\n';
            }
        }
        // Find the last task number
        let maxTaskNumber = 0;
        const lines = tasksContent.split('\n');
        for (const line of lines) {
            // Look for lines starting with '- [ ] ' followed by a number
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- [ ] ')) {
                const taskPart = trimmedLine.substring(6); // Remove '- [ ] '
                const numberMatch = taskPart.match(/^\d+/);
                if (numberMatch) {
                    const taskNumber = parseInt(numberMatch[0], 10);
                    if (taskNumber > maxTaskNumber) {
                        maxTaskNumber = taskNumber;
                    }
                }
            }
        }
        // Generate new task number
        const newTaskNumber = maxTaskNumber + 1;
        // Create new task content
        let newTask = `\n- [ ] ${newTaskNumber}. ${taskTitle}\n`;
        if (description) {
            newTask += `  - ${description}\n`;
        }
        newTask += `  - _Requirements: TBD_\n`;
        newTask += `  - _Prompt: TBD_\n`;
        // Append new task to tasks content
        tasksContent += newTask;
        // Write back to file
        await fs.writeFile(tasksPath, tasksContent, 'utf-8');
        console.log(`\n✅ Created task ${newTaskNumber} for spec '${specId}'`);
        console.log(`Task: ${taskTitle}`);
        if (description) {
            console.log(`Description: ${description}`);
        }
        console.log(`File: ${tasksPath}\n`);
    }
}
//# sourceMappingURL=cli-commands.js.map