# Spec Workflow CLI

A command-line interface for structured spec-driven development.

## ✨ Key Features

- **Structured Development Workflow** - Sequential spec creation (Requirements → Design → Tasks)
- **Task Management** - Create, list, and execute tasks
- **Task Progress Tracking** - Visual progress bars and detailed status
- **Implementation Logs** - Searchable logs of all task implementations
- **Archive System** - Archive completed specifications

## 🚀 Quick Start

### Step 1: Install globally

```bash
npm install -g @pimzino/spec-workflow-cli
```

Or use with npx:

```bash
npx @pimzino/spec-workflow-cli --help
```

### Step 2: Initialize your project

```bash
cd /path/to/your/project
spec-workflow create requirements my-first-spec
```

## 📝 CLI Commands

| Command                                       | Description                                                     |
| --------------------------------------------- | --------------------------------------------------------------- |
| `create <type> <name>`                        | Create specification document (requirements \| design \| tasks) |
| `create task <spec-id> <title> [description]` | Create new task in specification                                |
| `list [--status <status>]`                    | List all specifications                                         |
| `status <spec-id>`                            | Show specification progress details                             |
| `exec <spec-id> <task-id> [--yes]`            | Execute specific task                                           |
| `approve <spec-id> [--message <msg>]`         | Approve specification                                           |
| `reject <spec-id> --reason <reason>`          | Reject specification                                            |
| `logs <spec-id> [--lines <n> --follow]`       | View implementation logs                                        |
| `config set <key> <value>`                    | Modify configuration                                            |
| `archive <spec-id>`                           | Archive completed specification                                 |

## 💡 Usage Examples

```bash
# Create a requirements document
spec-workflow create requirements user-authentication

# Create a design document
spec-workflow create design user-profile

# Create a tasks document
spec-workflow create tasks user-authentication

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
```

## 📁 Project Structure

```
your-project/
  .spec-workflow/
    approvals/
    archive/
    specs/
    steering/
    templates/
    user-templates/
    config.example.toml
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the CLI locally
npx tsx src/index.ts --help
```

## 📄 License

GPL-3.0