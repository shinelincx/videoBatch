---
name: git-guardrails-claude-code
description: 为 Claude Code 设置钩子，在执行前拦截危险的 Git 命令（push、reset --hard、clean、branch -D 等）。适用于防止破坏性 Git 操作、添加 Git 安全钩子或在 Claude Code 中阻止 Git push/reset 的场景。
---

# 配置 Git 安全护栏

设置一个 PreToolUse 钩子，在 Claude 执行危险的 Git 命令之前进行拦截和阻止。

## 拦截的命令

- `git push`（所有变体，包括 `--force`）
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

触发拦截时，Claude 会收到一条提示信息，告知它无权执行这些命令。

## 操作步骤

### 1. 确认作用域

询问用户：仅安装到**当前项目**（`.claude/settings.json`）还是**所有项目**（`~/.claude/settings.json`）？

### 2. 复制钩子脚本

内置脚本位于：[scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)

根据作用域复制到对应位置：

- **项目级**：`.claude/hooks/block-dangerous-git.sh`
- **全局**：`~/.claude/hooks/block-dangerous-git.sh`

使用 `chmod +x` 添加可执行权限。

### 3. 在配置文件中注册钩子

添加到对应的配置文件中：

**项目级**（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**全局**（`~/.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

如果配置文件已存在，将钩子合并到现有的 `hooks.PreToolUse` 数组中，不要覆盖其他配置。

### 4. 询问自定义需求

询问用户是否需要添加或移除拦截列表中的模式。根据需要编辑已复制的脚本。

### 5. 验证

运行快速测试：

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <脚本路径>
```

应返回退出码 2，并在 stderr 中输出 BLOCKED 提示信息。
