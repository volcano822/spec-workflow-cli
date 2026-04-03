# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-04-03

### Added
- **CLI模式** - 完全重写为CLI命令行工具，移除MCP模式
- **完整的CLI命令集**：
  - `create <type> <name>` - 创建规格（requirements/design/task）
  - `list [--status <status>]` - 列出所有规格
  - `status <spec-id>` - 查看规格进度详情
  - `exec <spec-id> <task-id> [--yes]` - 执行指定任务
  - `approve <spec-id> [--message <msg>]` - 审批规格
  - `reject <spec-id> --reason <reason>` - 驳回规格
  - `logs <spec-id> [--lines <n> --follow]` - 查看实现日志
  - `config set <key> <value>` - 修改配置
  - `archive <spec-id>` - 归档已完成规格
  - `tools` - 列出可用工具（向后兼容）
  - `tool <name>` - 执行特定工具（向后兼容）
  - `prompts` - 列出可用提示（向后兼容）
  - `prompt <name>` - 获取特定提示（向后兼容）

### Changed
- **架构变更** - 完全移除MCP协议依赖，改为纯CLI实现
- **移除多语言支持** - 仅保留默认英文文档
- **移除仪表盘功能** - 不再提供Web仪表盘

### Removed
- MCP服务器模式
- Web仪表盘
- 多语言文档支持
- Docker部署支持
- VSCode扩展支持