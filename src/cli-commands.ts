import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PathUtils } from './core/path-utils.js';
import { SpecParser } from './core/parser.js';
import { SpecArchiveService } from './core/archive-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class SpecWorkflowCLI {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async initWorkspace(): Promise<void> {
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

  private async copyTemplates(): Promise<void> {
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
      } catch (error) {
        console.error(`Failed to copy template ${template}:`, error);
      }
    }
  }

  async createSpec(type: 'requirements' | 'design' | 'tasks', name: string): Promise<void> {
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
    } catch (error) {
      throw new Error(`Failed to create ${type} document: ${(error as Error).message}`);
    }
  }

  async listSpecs(status?: string): Promise<void> {
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
        } else if (completed === total) {
          displayStatus = 'Complete';
        } else if (inProgress > 0) {
          displayStatus = 'Implementing';
        } else if (completed > 0) {
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

  async getSpecStatus(specId: string): Promise<void> {
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

  async execTask(specId: string, taskId: string, yes: boolean = false): Promise<void> {
    const specPath = PathUtils.getSpecPath(this.projectPath, specId);
    const tasksPath = join(specPath, 'tasks.md');

    try {
      await fs.access(tasksPath);
    } catch {
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

  async approveSpec(specId: string, message?: string): Promise<void> {
    console.log(`\n✅ Approving spec '${specId}'...`);
    if (message) {
      console.log(`Message: ${message}`);
    }
    console.log('(This is a placeholder - actual approval logic would be implemented here)\n');
  }

  async rejectSpec(specId: string, reason: string): Promise<void> {
    console.log(`\n❌ Rejecting spec '${specId}'...`);
    console.log(`Reason: ${reason}`);
    console.log('(This is a placeholder - actual rejection logic would be implemented here)\n');
  }

  async viewLogs(specId: string, lines?: number, follow?: boolean): Promise<void> {
    console.log(`\n📜 Logs for spec '${specId}':`);
    if (lines) {
      console.log(`Showing last ${lines} lines`);
    }
    if (follow) {
      console.log('Following real-time updates');
    }
    console.log('(This is a placeholder - actual log viewing logic would be implemented here)\n');
  }

  async setConfig(key: string, value: string): Promise<void> {
    console.log(`\n⚙️  Setting config ${key} = ${value}`);
    console.log('(This is a placeholder - actual config setting logic would be implemented here)\n');
  }

  async archiveSpec(specId: string): Promise<void> {
    const archiveService = new SpecArchiveService(this.projectPath);
    await archiveService.archiveSpec(specId);
    console.log(`\n📦 Archived spec '${specId}' successfully\n`);
  }

  async createTask(specId: string, taskTitle: string, description?: string): Promise<void> {
    const specPath = PathUtils.getSpecPath(this.projectPath, specId);
    const tasksPath = join(specPath, 'tasks.md');

    try {
      // Check if spec exists
      await fs.access(specPath);
    } catch {
      throw new Error(`Spec '${specId}' not found`);
    }

    let tasksContent = '';
    try {
      tasksContent = await fs.readFile(tasksPath, 'utf-8');
    } catch {
      // Tasks file doesn't exist, create it with template
      const templatePath = join(PathUtils.getTemplatesPath(this.projectPath), 'tasks-template.md');
      try {
        tasksContent = await fs.readFile(templatePath, 'utf-8');
        tasksContent = tasksContent
          .replace(/{{featureName}}/g, specId)
          .replace(/{{date}}/g, new Date().toISOString().split('T')[0]);
      } catch {
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

  async showGuide(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const guide = `# Spec Development Workflow

## Overview

You guide users through spec-driven development using CLI tools. Transform rough ideas into detailed specifications through Requirements → Design → Tasks → Implementation phases.
Feature names use kebab-case (e.g., user-authentication). Create ONE spec at a time.

## Workflow Diagram
\`\`\`mermaid
flowchart TD
    Start([Start: User requests feature]) --> CheckSteering{Steering docs exist?}
    CheckSteering -->|Yes| P1_Load[Read steering docs:<br/>.spec-workflow/steering/*.md]
    CheckSteering -->|No| P1_Template

    %% Phase 1: Requirements
    P1_Load --> P1_Template[Check user-templates first,<br/>then read template:<br/>requirements-template.md]
    P1_Template --> P1_Research[Research if needed]
    P1_Research --> P1_Create[Create file:<br/>.spec-workflow/specs/{name}/<br/>requirements.md]
    P1_Create --> P1_Status[Create spec: spec-workflow create requirements {name}]

    %% Phase 2: Design
    P1_Status --> P2_Template[Check user-templates first,<br/>then read template:<br/>design-template.md]
    P2_Template --> P2_Analyze[Analyze codebase patterns]
    P2_Analyze --> P2_Create[Create file:<br/>.spec-workflow/specs/{name}/<br/>design.md]
    P2_Create --> P2_Status[Create spec: spec-workflow create design {name}]

    %% Phase 3: Tasks
    P2_Status --> P3_Template[Check user-templates first,<br/>then read template:<br/>tasks-template.md]
    P3_Template --> P3_Break[Convert design to tasks]
    P3_Break --> P3_Create[Create file:<br/>.spec-workflow/specs/{name}/<br/>tasks.md]
    P3_Create --> P3_Status[Create spec: spec-workflow create tasks {name}]

    %% Phase 4: Implementation
    P3_Status --> P4_Ready[Spec complete.<br/>Ready to implement?]
    P4_Ready -->|Yes| P4_Status[Check status: spec-workflow status {name}]
    P4_Status --> P4_Code[Implement code]
    P4_Code --> P4_Complete[Check progress: spec-workflow list]
    P4_Complete --> P4_More{More tasks?}
    P4_More -->|Yes| P4_Code
    P4_More -->|No| End([Implementation Complete])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style CheckSteering fill:#fff4e6
    style P4_More fill:#fff4e6
\`\`\`

## Spec Workflow

### Phase 1: Requirements
**Purpose**: Define what to build based on user needs.

**File Operations**:
- Read steering docs: \`.spec-workflow/steering/*.md\` (if they exist)
- Check for custom template: \`.spec-workflow/user-templates/requirements-template.md\`
- Read template: \`.spec-workflow/templates/requirements-template.md\` (if no custom template)
- Create document: \`.spec-workflow/specs/{spec-name}/requirements.md\`

**CLI Commands**:
- \`spec-workflow create requirements <spec-name>\`: Create requirements document

**Process**:
1. Check if \`.spec-workflow/steering/\` exists (if yes, read product.md, tech.md, structure.md)
2. Check for custom template at \`.spec-workflow/user-templates/requirements-template.md\`
3. If no custom template, use the default template
4. Research market/user expectations if needed (current year: ${currentYear})
5. Generate requirements as user stories
6. Create \`requirements.md\` using the CLI command above
7. Once requirements are done, move to Design phase

### Phase 2: Design
**Purpose**: Create technical design addressing all requirements.

**File Operations**:
- Check for custom template: \`.spec-workflow/user-templates/design-template.md\`
- Read template: \`.spec-workflow/templates/design-template.md\` (if no custom template)
- Create document: \`.spec-workflow/specs/{spec-name}/design.md\`

**CLI Commands**:
- \`spec-workflow create design <spec-name>\`: Create design document

**Process**:
1. Check for custom template at \`.spec-workflow/user-templates/design-template.md\`
2. If no custom template, use the default template
3. Analyze codebase for patterns to reuse
4. Research technology choices if needed (current year: ${currentYear})
5. Generate design with all template sections
6. Create \`design.md\` using the CLI command above
7. Once design is done, move to Tasks phase

### Phase 3: Tasks
**Purpose**: Break design into atomic implementation tasks.

**File Operations**:
- Check for custom template: \`.spec-workflow/user-templates/tasks-template.md\`
- Read template: \`.spec-workflow/templates/tasks-template.md\` (if no custom template)
- Create document: \`.spec-workflow/specs/{spec-name}/tasks.md\`

**CLI Commands**:
- \`spec-workflow create tasks <spec-name>\`: Create tasks document
- \`spec-workflow create task <spec-id> <title> [description]\`: Create new task

**Process**:
1. Check for custom template at \`.spec-workflow/user-templates/tasks-template.md\`
2. If no custom template, use the default template
3. Convert design into atomic tasks (1-3 files each)
4. Include file paths and requirement references
5. Create \`tasks.md\` using the CLI command above
6. After tasks are created, you're ready for implementation

### Phase 4: Implementation
**Purpose**: Execute tasks systematically.

**File Operations**:
- Read specs: \`.spec-workflow/specs/{spec-name}/*.md\` (if returning to work)
- Edit tasks.md to update status:
  - \`- [ ]\` = Pending task
  - \`- [-]\` = In-progress task
  - \`- [x]\` = Completed task

**CLI Commands**:
- \`spec-workflow list [--status <status>]\`: List all specifications
- \`spec-workflow status <spec-id>\`: Show specification progress details
- \`spec-workflow archive <spec-id>\`: Archive completed specification

**Process**:
1. Check current status with \`spec-workflow status <spec-id>\`
2. Read \`tasks.md\` to see all tasks
3. For each task:
   - Edit tasks.md: Change \`[ ]\` to \`[-]\` for the task you're starting
   - Implement the code according to the task description
   - Test your implementation
   - Edit tasks.md: Change \`[-]\` to \`[x]\`
4. Continue until all tasks show \`[x]\`
5. When done, archive with \`spec-workflow archive <spec-id>\`

## Workflow Rules

- Create documents directly at specified file paths
- Read templates from \`.spec-workflow/templates/\` directory
- Follow exact template structures
- Complete phases in sequence (no skipping)
- One spec at a time
- Use kebab-case for spec names
- Steering docs are optional - only create when explicitly requested

## File Structure
\`\`\`
.spec-workflow/
├── templates/           # Auto-populated on init
│   ├── requirements-template.md
│   ├── design-template.md
│   └── tasks-template.md
├── specs/
│   └── {spec-name}/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── archive/             # Archived specs
└── steering/
    ├── product.md
    ├── tech.md
    └── structure.md
\`\`\`

## Quick Start

1. Initialize workspace (first time only):
   \`\`\`
   spec-workflow create requirements my-first-feature
   \`\`\`
   (This will automatically initialize the workspace)

2. Create requirements document:
   \`\`\`
   spec-workflow create requirements my-feature
   \`\`\`

3. Create design document:
   \`\`\`
   spec-workflow create design my-feature
   \`\`\`

4. Create tasks document:
   \`\`\`
   spec-workflow create tasks my-feature
   \`\`\`

5. List all specs:
   \`\`\`
   spec-workflow list
   \`\`\`

6. Check spec status:
   \`\`\`
   spec-workflow status my-feature
   \`\`\`

7. Add a new task:
   \`\`\`
   spec-workflow create task my-feature "Implement login form"
   \`\`\`

8. Archive completed spec:
   \`\`\`
   spec-workflow archive my-feature
   \`\`\`

For more help, run: \`spec-workflow --help\`
`;
    console.log(guide);
  }
}
