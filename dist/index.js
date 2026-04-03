#!/usr/bin/env node
import { SpecWorkflowCLI } from './cli-commands.js';
import { homedir } from 'os';
import { resolveGitRoot, resolveGitWorkspaceRoot } from './core/git-utils.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';
function showHelp() {
    console.error(`
Spec Workflow CLI - A command-line interface for spec-driven development

USAGE:
  spec-workflow [command] [arguments] [options]

COMMANDS:
  create <type> <name>       Create specification document
                              <type>: requirements | design | tasks
                              <name>: Spec name in kebab-case
  create task <spec-id> <title> [description]
                              Create new task in specification
                              <spec-id>: Spec ID to add task to
                              <title>: Task title
                              [description]: Optional task description
  list [--status <status>]    List all specifications
                              --status: Filter by status (optional)
  status <spec-id>            Show specification progress details
  exec <spec-id> <task-id> [--yes]
                              Execute specific task
                              --yes: Skip confirmation prompt
  approve <spec-id> [--message <msg>]
                              Approve specification
                              --message: Approval message (optional)
  reject <spec-id> --reason <reason>
                              Reject specification
                              --reason: Rejection reason (required)
  logs <spec-id> [--lines <n> --follow]
                              View implementation logs
                              --lines: Number of lines to show
                              --follow: Follow real-time updates
  config set <key> <value>    Modify configuration
  archive <spec-id>            Archive completed specification

ARGUMENTS:
  path                        Project path (defaults to current directory)
                              Supports ~ for home directory

OPTIONS:
  --help                      Show this help message
  --no-shared-worktree-specs
                              Disable shared .spec-workflow in git worktrees
                              Use workspace-local .spec-workflow instead of main repo

EXAMPLES:
  # Create a requirements document
  spec-workflow create requirements user-authentication

  # Create a design document
  spec-workflow create design user-profile

  # Create a new task
  spec-workflow create task user-authentication "Implement login form"

  # Create a new task with description
  spec-workflow create task user-authentication "Add password recovery" "Implement forgot password functionality"

  # List all specs
  spec-workflow list

  # List specs with specific status
  spec-workflow list --status complete

  # Show spec status
  spec-workflow status user-authentication

  # Execute a task
  spec-workflow exec user-authentication 1.1 --yes

  # Approve a spec
  spec-workflow approve user-authentication --message "Looks good!"

  # Reject a spec
  spec-workflow reject user-authentication --reason "Needs more details"

  # View logs
  spec-workflow logs user-authentication --lines 50 --follow

  # Set config
  spec-workflow config set lang en

  # Archive a spec
  spec-workflow archive user-authentication

For more information, visit: https://github.com/feisir/spec-workflow-mcp
`);
}
function expandTildePath(path) {
    if (path.startsWith('~/') || path === '~') {
        return path.replace('~', homedir());
    }
    return path;
}
export function parseArguments(args) {
    let command = 'help';
    const subCommands = [];
    let noSharedWorktreeSpecs = false;
    const options = {};
    let pathArg = process.cwd();
    const validFlags = ['--help', '-h', '--no-shared-worktree-specs', '--status', '--yes', '--message', '--reason', '--lines', '--follow'];
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            if (arg.includes('=')) {
                const [flag, value] = arg.split('=');
                if (!validFlags.includes(flag)) {
                    throw new Error(`Unknown option: ${flag}\nUse --help to see available options.`);
                }
                if (flag === '--status') {
                    options.status = value;
                }
                else if (flag === '--message') {
                    options.message = value;
                }
                else if (flag === '--reason') {
                    options.reason = value;
                }
                else if (flag === '--lines') {
                    options.lines = parseInt(value, 10);
                }
            }
            else {
                if (!validFlags.includes(arg)) {
                    throw new Error(`Unknown option: ${arg}\nUse --help to see available options.`);
                }
                if (arg === '--help' || arg === '-h') {
                    showHelp();
                    process.exit(0);
                }
                else if (arg === '--no-shared-worktree-specs') {
                    noSharedWorktreeSpecs = true;
                }
                else if (arg === '--yes') {
                    options.yes = true;
                }
                else if (arg === '--follow') {
                    options.follow = true;
                }
                else if (arg === '--status' && i + 1 < args.length) {
                    options.status = args[i + 1];
                    i++;
                }
                else if (arg === '--message' && i + 1 < args.length) {
                    options.message = args[i + 1];
                    i++;
                }
                else if (arg === '--reason' && i + 1 < args.length) {
                    options.reason = args[i + 1];
                    i++;
                }
                else if (arg === '--lines' && i + 1 < args.length) {
                    options.lines = parseInt(args[i + 1], 10);
                    i++;
                }
            }
        }
        else if (command === 'help') {
            command = arg;
        }
        else {
            subCommands.push(arg);
        }
        i++;
    }
    const expandedPath = expandTildePath(pathArg);
    const workspacePath = resolveGitWorkspaceRoot(expandedPath);
    const workflowRootPath = noSharedWorktreeSpecs ? workspacePath : resolveGitRoot(workspacePath);
    return {
        command,
        subCommands,
        workspacePath,
        workflowRootPath,
        expandedPath,
        noSharedWorktreeSpecs,
        options
    };
}
async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.includes('--help') || args.includes('-h')) {
            showHelp();
            process.exit(0);
        }
        const cliArgs = parseArguments(args);
        const { command, subCommands, workspacePath, workflowRootPath, noSharedWorktreeSpecs, options } = cliArgs;
        if (workspacePath !== workflowRootPath) {
            console.error('Git worktree detected.');
            console.error(`workspacePath=${workspacePath}`);
            console.error(`workflowRootPath=${workflowRootPath}`);
        }
        else if (noSharedWorktreeSpecs) {
            console.error('Shared worktree specs disabled. Using workspace-local .spec-workflow.');
            console.error(`workspacePath=${workspacePath}`);
        }
        const cli = new SpecWorkflowCLI(workflowRootPath);
        switch (command) {
            case 'create':
                if (subCommands.length < 1) {
                    console.error('Error: create command requires arguments');
                    console.error('Usage: spec-workflow create <type> <name>');
                    console.error('  <type>: requirements | design | tasks');
                    console.error('OR');
                    console.error('Usage: spec-workflow create task <spec-id> <title> [description]');
                    process.exit(1);
                }
                if (subCommands[0] === 'task') {
                    if (subCommands.length < 3) {
                        console.error('Error: create task command requires <spec-id> and <title>');
                        console.error('Usage: spec-workflow create task <spec-id> <title> [description]');
                        process.exit(1);
                    }
                    const [, specId, title, ...descriptionParts] = subCommands;
                    const description = descriptionParts.join(' ');
                    await cli.initWorkspace();
                    await cli.createTask(specId, title, description);
                }
                else {
                    if (subCommands.length < 2) {
                        console.error('Error: create command requires <type> and <name>');
                        console.error('Usage: spec-workflow create <type> <name>');
                        console.error('  <type>: requirements | design | tasks');
                        process.exit(1);
                    }
                    const [type, name] = subCommands;
                    if (!['requirements', 'design', 'tasks'].includes(type)) {
                        console.error(`Error: Invalid type "${type}". Must be requirements, design, or tasks.`);
                        process.exit(1);
                    }
                    await cli.initWorkspace();
                    await cli.createSpec(type, name);
                }
                break;
            case 'list':
                await cli.initWorkspace();
                await cli.listSpecs(options.status);
                break;
            case 'status':
                if (subCommands.length < 1) {
                    console.error('Error: status command requires <spec-id>');
                    console.error('Usage: spec-workflow status <spec-id>');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.getSpecStatus(subCommands[0]);
                break;
            case 'exec':
                if (subCommands.length < 2) {
                    console.error('Error: exec command requires <spec-id> and <task-id>');
                    console.error('Usage: spec-workflow exec <spec-id> <task-id> [--yes]');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.execTask(subCommands[0], subCommands[1], options.yes);
                break;
            case 'approve':
                if (subCommands.length < 1) {
                    console.error('Error: approve command requires <spec-id>');
                    console.error('Usage: spec-workflow approve <spec-id> [--message <msg>]');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.approveSpec(subCommands[0], options.message);
                break;
            case 'reject':
                if (subCommands.length < 1) {
                    console.error('Error: reject command requires <spec-id>');
                    console.error('Usage: spec-workflow reject <spec-id> --reason <reason>');
                    process.exit(1);
                }
                if (!options.reason) {
                    console.error('Error: reject command requires --reason');
                    console.error('Usage: spec-workflow reject <spec-id> --reason <reason>');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.rejectSpec(subCommands[0], options.reason);
                break;
            case 'logs':
                if (subCommands.length < 1) {
                    console.error('Error: logs command requires <spec-id>');
                    console.error('Usage: spec-workflow logs <spec-id> [--lines <n> --follow]');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.viewLogs(subCommands[0], options.lines, options.follow);
                break;
            case 'config':
                if (subCommands.length < 1 || subCommands[0] !== 'set') {
                    console.error('Error: config command only supports "set" subcommand');
                    console.error('Usage: spec-workflow config set <key> <value>');
                    process.exit(1);
                }
                if (subCommands.length < 3) {
                    console.error('Error: config set requires <key> and <value>');
                    console.error('Usage: spec-workflow config set <key> <value>');
                    process.exit(1);
                }
                await cli.setConfig(subCommands[1], subCommands[2]);
                break;
            case 'archive':
                if (subCommands.length < 1) {
                    console.error('Error: archive command requires <spec-id>');
                    console.error('Usage: spec-workflow archive <spec-id>');
                    process.exit(1);
                }
                await cli.initWorkspace();
                await cli.archiveSpec(subCommands[0]);
                break;
            case 'help':
            default:
                showHelp();
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('ENOENT') || error.message.includes('path') || error.message.includes('directory')) {
            console.error('\nProject path troubleshooting:');
            console.error('- Verify the project path exists and is accessible');
            console.error('- Check that the path doesn\'t contain special characters that need escaping');
            console.error(`- Current working directory: ${process.cwd()}`);
        }
        process.exit(1);
    }
}
export function resolveEntrypoint(pathValue) {
    if (!pathValue)
        return undefined;
    try {
        return realpathSync(pathValue);
    }
    catch {
        return resolve(pathValue);
    }
}
const entrypoint = resolveEntrypoint(process.argv[1]);
const currentFile = resolveEntrypoint(fileURLToPath(import.meta.url));
if (entrypoint && currentFile && currentFile === entrypoint) {
    main().catch(() => process.exit(1));
}
//# sourceMappingURL=index.js.map