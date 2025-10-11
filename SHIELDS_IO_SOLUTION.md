# Shields.io 解决方案 - GitHub Stars 和 Citations

## 概述

使用 **shields.io** 的动态 badge 功能来显示 GitHub stars 和论文引用数。这个方案的最大优势是：

✅ **第一次访问就能看到数据** - 不需要等待 API 调用  
✅ **无需客户端 JavaScript** - shields.io 服务器端处理  
✅ **自动缓存** - shields.io 缓存 24 小时  
✅ **简单维护** - 只需在 publications.json 添加 `arxiv_id` 和 `github_repo`  

## 工作原理

### GitHub Stars
使用 shields.io 的 GitHub stars badge：
```
https://img.shields.io/github/stars/{owner}/{repo}?style=social
```

例如：
```
https://img.shields.io/github/stars/RAIVNLab/GenerateAnyScene?style=social
```

### Citations
使用 shields.io 的 dynamic JSON badge，直接从 Semantic Scholar API 获取数据：
```
https://img.shields.io/badge/dynamic/json?
  style=social&
  logo=semanticscholar&
  label=&
  url=https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}?fields=citationCount&
  query=$.citationCount&
  suffix= cite.&
  cacheSeconds=86400
```

例如（arXiv ID: 2412.08221）：
```
https://img.shields.io/badge/dynamic/json?style=social&logo=semanticscholar&label=&url=https%3A%2F%2Fapi.semanticscholar.org%2Fgraph%2Fv1%2Fpaper%2FarXiv%3A2412.08221%3Ffields%3DcitationCount&query=%24.citationCount&suffix=%20cite.&cacheSeconds=86400
```

## 如何使用

### 1. 在 publications.json 中添加字段

为每篇论文添加：
- `arxiv_id`: arXiv ID（例如 "2412.08221"）
- `github_repo`: GitHub 仓库（例如 "RAIVNLab/GenerateAnyScene"）

示例：
```json
{
  "id": "gas",
  "title": "Generate Any Scene...",
  "arxiv_id": "2412.08221",
  "github_repo": "RAIVNLab/GenerateAnyScene",
  "links": {
    "arxiv": "https://arxiv.org/abs/2412.08221",
    "code": "https://github.com/RAIVNLab/GenerateAnyScene"
  }
}
```

### 2. JavaScript 自动生成 badges

代码会自动检测 `arxiv_id` 和 `github_repo` 字段，并生成相应的 shields.io badge。

## 优势对比

### 之前的方案（客户端 API 调用）
❌ 第一次访问需要等待 API 响应  
❌ 需要复杂的缓存逻辑  
❌ 可能遇到 API 限制  
❌ 需要处理错误和加载状态  

### 现在的方案（shields.io）
✅ 立即显示（shields.io 缓存）  
✅ 无需客户端代码  
✅ shields.io 处理所有 API 调用和缓存  
✅ 自动错误处理  
✅ 24小时自动刷新  

## 显示效果

链接会显示为：

```
[arXiv 📖 45 cite.] [Code ⭐ 1.2K] [Website] [HuggingFace]
```

其中：
- 📖 45 cite. 是 shields.io 的 badge
- ⭐ 1.2K 是 shields.io 的 badge

## 缓存机制

- **shields.io 缓存**: 86400 秒（24 小时）
- **浏览器缓存**: 根据 HTTP headers
- **更新频率**: 每 24 小时自动刷新一次

## 注意事项

### arXiv ID
- 必须是纯数字格式，例如 "2412.08221"
- 不要包含 "arXiv:" 前缀
- 从 arXiv URL 中提取：`https://arxiv.org/abs/2412.08221` → `2412.08221`

### GitHub Repo
- 格式：`owner/repo`
- 例如：`RAIVNLab/GenerateAnyScene`
- 不要包含 `https://github.com/`
- 不要包含 `.git` 后缀

## 测试

1. 打开网站
2. 应该立即看到 stars 和 citations badges
3. 如果没有显示，检查：
   - `arxiv_id` 和 `github_repo` 是否正确
   - 浏览器控制台是否有错误
   - shields.io 服务是否正常

## 手动测试 Badge URL

### GitHub Stars
在浏览器中打开：
```
https://img.shields.io/github/stars/RAIVNLab/GenerateAnyScene?style=social
```

应该看到一个显示 stars 数量的 badge。

### Citations
在浏览器中打开：
```
https://img.shields.io/badge/dynamic/json?style=social&logo=semanticscholar&label=&url=https%3A%2F%2Fapi.semanticscholar.org%2Fgraph%2Fv1%2Fpaper%2FarXiv%3A2412.08221%3Ffields%3DcitationCount&query=%24.citationCount&suffix=%20cite.&cacheSeconds=86400
```

应该看到一个显示引用数的 badge。

## 样式自定义

可以修改 shields.io 参数来自定义样式：

- `style=social` - 社交媒体风格（推荐）
- `style=flat` - 扁平风格
- `style=flat-square` - 方形扁平风格
- `style=for-the-badge` - 大号 badge

## 参考

- [Shields.io 官方文档](https://shields.io/)
- [Shields.io Dynamic Badges](https://shields.io/badges/dynamic-json-badge)
- [GitHub API](https://docs.github.com/en/rest)
- [Semantic Scholar API](https://api.semanticscholar.org/)

## 示例网站

参考 [hq-fang.github.io](https://github.com/hq-fang/hq-fang.github.io) 的实现方式。

