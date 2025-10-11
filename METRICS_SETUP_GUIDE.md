# GitHub Stars 和 Citations 设置指南

## 🎯 工作原理

### 方案概述
使用 **GitHub Actions** 每天自动获取最新的 GitHub stars 和论文引用数，并保存到 `publications.json` 文件中。这样：

✅ **第一次访问就能看到数据** - 数据已经在 JSON 文件中  
✅ **无需等待 API 调用** - 页面立即加载  
✅ **自动更新** - 每天自动刷新一次  
✅ **零维护** - 完全自动化  

### 数据流程

```
GitHub Actions (每天运行)
    ↓
运行 update_metrics.py
    ↓
调用 GitHub API + Semantic Scholar API
    ↓
更新 publications.json
    ↓
自动提交到仓库
    ↓
GitHub Pages 自动部署
    ↓
用户访问网站 → 立即看到数据
```

## 📝 已完成的设置

### 1. ✅ publications.json 已添加字段
每篇论文都有：
- `arxiv_id`: arXiv ID（例如 "2412.08221"）
- `github_repo`: GitHub 仓库（例如 "RAIVNLab/GenerateAnyScene"）
- `github_stars`: GitHub stars 数量（自动更新）
- `citations`: 引用数（自动更新）

### 2. ✅ Python 脚本已创建
`update_metrics.py` - 获取最新数据并更新 JSON 文件

### 3. ✅ GitHub Actions 工作流已配置
`.github/workflows/update-metrics.yml` - 每天自动运行

### 4. ✅ JavaScript 已更新
`assets/js/publications.js` - 优先显示 JSON 中的预获取数据

## 🚀 部署步骤

### 第一步：提交代码到 GitHub

```bash
git add .
git commit -m "Add automated metrics fetching with GitHub Actions"
git push
```

### 第二步：启用 GitHub Actions

1. 访问你的 GitHub 仓库
2. 点击 **Settings** → **Actions** → **General**
3. 确保 **Actions permissions** 设置为：
   - ✅ Allow all actions and reusable workflows
4. 在 **Workflow permissions** 部分：
   - ✅ 选择 **Read and write permissions**
   - ✅ 勾选 **Allow GitHub Actions to create and approve pull requests**

### 第三步：手动触发第一次运行（可选）

1. 访问 **Actions** 标签页
2. 点击左侧的 **Update Publication Metrics**
3. 点击右侧的 **Run workflow** → **Run workflow**
4. 等待几分钟，查看运行结果

### 第四步：验证

1. 等待 1-2 分钟让 GitHub Pages 部署
2. 访问你的网站
3. 应该能看到：
   - `Code ⭐ 32` - GitHub stars
   - `arXiv 📖 1 cite.` - Citations

## 📊 当前数据

根据最新获取的数据：

| 论文 | GitHub Stars | Citations |
|------|--------------|-----------|
| SOS | ⭐ 14 | - (arXiv ID 待更新) |
| Generate Any Scene | ⭐ 32 | 📖 1 |
| ProVision | ⭐ 35 | 📖 11 |
| Task Me Anything | ⭐ 73 | 📖 21 |
| m&m's | ⭐ 42 | 📖 29 |

## ⏰ 自动更新时间表

- **频率**: 每天一次
- **时间**: UTC 00:00（北京时间 08:00）
- **触发方式**: 自动（也可以手动触发）

## 🔧 手动更新数据

如果你想立即更新数据，有两种方式：

### 方式 1：本地运行脚本

```bash
python3 update_metrics.py
git add publications.json
git commit -m "Update metrics"
git push
```

### 方式 2：GitHub Actions 手动触发

1. 访问仓库的 **Actions** 标签页
2. 选择 **Update Publication Metrics**
3. 点击 **Run workflow**

## 📝 添加新论文

当你添加新论文时，只需在 `publications.json` 中添加：

```json
{
  "id": "new-paper",
  "title": "Your Paper Title",
  "arxiv_id": "2501.12345",           // ← 添加这个
  "github_repo": "username/repo",     // ← 添加这个
  "links": {
    "arxiv": "https://arxiv.org/abs/2501.12345",
    "code": "https://github.com/username/repo"
  }
}
```

下次 GitHub Actions 运行时，会自动获取这篇论文的 stars 和 citations。

## 🐛 故障排除

### GitHub Actions 没有运行？

**检查权限**：
1. Settings → Actions → General
2. 确保启用了 Actions
3. 确保有 **Read and write permissions**

### 数据没有更新？

**查看 Actions 日志**：
1. 访问 **Actions** 标签页
2. 点击最近的运行记录
3. 查看详细日志，看是否有错误

**常见错误**：
- **API 速率限制**: Semantic Scholar API 有速率限制，脚本会自动重试
- **arXiv ID 错误**: 确保 arXiv ID 格式正确（例如 "2412.08221"）
- **仓库不存在**: 确保 GitHub 仓库是公开的

### 网站上看不到数据？

**检查步骤**：
1. 确认 `publications.json` 中有 `github_stars` 和 `citations` 字段
2. 清除浏览器缓存并刷新
3. 检查浏览器控制台是否有错误
4. 确认 GitHub Pages 已经部署了最新版本

## 📈 性能优化

### 当前配置
- ✅ 数据预先获取并保存在 JSON 中
- ✅ 页面加载时立即显示数据
- ✅ 不需要客户端 API 调用
- ✅ 每天自动更新一次

### 可选优化
如果你想更频繁地更新数据，可以修改 `.github/workflows/update-metrics.yml`：

```yaml
on:
  schedule:
    # 每 6 小时运行一次
    - cron: '0 */6 * * *'
```

**注意**: 更频繁的更新可能会遇到 API 速率限制。

## 🎨 显示效果

### 链接顺序
1. **arXiv** (带 citations)
2. **Code** (带 stars)
3. Website
4. HuggingFace
5. 其他链接

### 格式示例
```
[arXiv 📖 21 cite.] [Code ⭐ 73] [Website] [HuggingFace]
```

### 数字格式化
- 小于 1000: 显示原始数字（例如 "73"）
- 大于等于 1000: 显示 K 后缀（例如 "1.2K"）

## 📚 相关文件

- `publications.json` - 论文数据（包含 metrics）
- `update_metrics.py` - 获取 metrics 的 Python 脚本
- `.github/workflows/update-metrics.yml` - GitHub Actions 配置
- `assets/js/publications.js` - 前端显示逻辑
- `assets/css/style.scss` - 样式定义

## ✅ 下一步

1. ✅ 提交代码到 GitHub
2. ✅ 启用 GitHub Actions 权限
3. ✅ 手动触发第一次运行（可选）
4. ✅ 验证网站显示效果
5. ✅ 更新 SOS 论文的真实 arXiv ID

## 🎉 完成！

现在你的网站会：
- ✅ 第一次访问就显示 stars 和 citations
- ✅ 每天自动更新数据
- ✅ 无需手动维护

如有问题，查看 GitHub Actions 的运行日志或检查浏览器控制台。

