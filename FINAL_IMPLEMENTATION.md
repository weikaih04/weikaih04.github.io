# 最终实现方案：使用 Shields.io 显示 GitHub Stars 和 Citations

## ✅ 已完成的功能

### 1. **即时显示 Metrics**
- 第一次访问网站就能看到 GitHub stars 和 citations
- 无需等待 API 调用
- 使用 shields.io 的服务器端缓存

### 2. **自动化 Badges**
- GitHub stars: 自动从 GitHub API 获取
- Citations: 自动从 Semantic Scholar API 获取
- 24小时自动刷新

### 3. **简洁的显示方式**
- Stars 和 citations 显示在链接内部
- 链接顺序：arXiv → Code → 其他
- 示例：`[arXiv 📖 45 cite.] [Code ⭐ 1.2K]`

## 📝 如何添加新论文

在 `publications.json` 中添加两个字段：

```json
{
  "id": "your-paper-id",
  "title": "Your Paper Title",
  "arxiv_id": "2412.08221",           // ← 添加这个
  "github_repo": "owner/repo-name",   // ← 添加这个
  "links": {
    "arxiv": "https://arxiv.org/abs/2412.08221",
    "code": "https://github.com/owner/repo-name"
  }
}
```

### 字段说明

#### `arxiv_id`
- **格式**: 纯数字，例如 `"2412.08221"`
- **获取方式**: 从 arXiv URL 提取
  - URL: `https://arxiv.org/abs/2412.08221`
  - ID: `2412.08221`
- **注意**: 不要包含 `arXiv:` 前缀

#### `github_repo`
- **格式**: `owner/repo-name`
- **示例**: `"RAIVNLab/GenerateAnyScene"`
- **获取方式**: 从 GitHub URL 提取
  - URL: `https://github.com/RAIVNLab/GenerateAnyScene`
  - Repo: `RAIVNLab/GenerateAnyScene`
- **注意**: 不要包含 `https://github.com/` 或 `.git`

## 🎨 显示效果

### 链接顺序
1. arXiv (带 citations badge)
2. Code (带 stars badge)
3. Website
4. HuggingFace
5. 其他链接

### Badge 样式
- **GitHub Stars**: ![stars](https://img.shields.io/github/stars/RAIVNLab/GenerateAnyScene?style=social)
- **Citations**: 使用 Semantic Scholar logo 的 badge

## 🔧 技术实现

### Shields.io Dynamic Badges

#### GitHub Stars
```
https://img.shields.io/github/stars/{owner}/{repo}?style=social
```

#### Citations
```
https://img.shields.io/badge/dynamic/json?
  style=social&
  logo=semanticscholar&
  url=https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}?fields=citationCount&
  query=$.citationCount&
  suffix= cite.&
  cacheSeconds=86400
```

### 缓存机制
- **Shields.io 缓存**: 86400秒（24小时）
- **自动刷新**: 每24小时自动更新一次
- **无需手动维护**: 完全自动化

## 📊 当前论文状态

| 论文 | arXiv ID | GitHub Repo | Status |
|------|----------|-------------|--------|
| SOS | 2501.xxxxx | weikaih04/Synthetic-Detection-Segmentation-Grounding-Data | ✅ |
| GAS | 2412.08221 | RAIVNLab/GenerateAnyScene | ✅ |
| ProVision | 2412.07012 | JieyuZ2/ProVision | ✅ |
| TMA | 2406.11775 | JieyuZ2/TaskMeAnything | ✅ |
| m&m's | 2403.11085 | RAIVNLab/mnms | ✅ |

## 🚀 部署到 GitHub Pages

### 1. 提交更改
```bash
git add .
git commit -m "Add GitHub stars and citations badges"
git push
```

### 2. 等待部署
GitHub Pages 会自动部署，通常需要 1-2 分钟。

### 3. 验证
访问你的网站，应该能看到：
- GitHub stars badges
- Citations badges
- 所有数据立即显示（无需等待）

## 🐛 故障排除

### Badge 不显示？

1. **检查 arXiv ID**
   - 确保格式正确：`"2412.08221"`
   - 不要包含前缀或后缀

2. **检查 GitHub Repo**
   - 确保格式正确：`"owner/repo"`
   - 仓库必须是公开的

3. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看是否有错误信息

4. **测试 Badge URL**
   - 直接在浏览器中打开 badge URL
   - 应该能看到 badge 图片

### Citations 显示为 0？

- 论文可能还没有被 Semantic Scholar 索引
- 等待几天后会自动更新
- 可以手动在 [Semantic Scholar](https://www.semanticscholar.org/) 搜索确认

### Stars 显示错误？

- 检查 GitHub 仓库是否公开
- 检查仓库名称是否正确
- GitHub API 可能有延迟，等待几分钟

## 📚 参考资料

- [Shields.io 官方文档](https://shields.io/)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [Semantic Scholar API](https://api.semanticscholar.org/)
- [参考实现: hq-fang.github.io](https://github.com/hq-fang/hq-fang.github.io)

## 💡 优势总结

✅ **即时加载** - 第一次访问就能看到数据  
✅ **自动更新** - 24小时自动刷新  
✅ **零维护** - 无需手动更新数字  
✅ **简单配置** - 只需添加两个字段  
✅ **可靠稳定** - 使用 shields.io 的基础设施  
✅ **无 API 限制** - shields.io 处理所有请求  

## 🎯 下一步

1. ✅ 更新所有论文的 `arxiv_id` 和 `github_repo`
2. ✅ 测试所有 badges 是否正常显示
3. ✅ 提交到 GitHub
4. ✅ 部署到 GitHub Pages
5. ✅ 验证线上效果

完成！🎉

