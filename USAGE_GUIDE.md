# 网站使用指南

## 🎯 完成的功能

### 1. 字体更新
✅ 网站字体已从 "Noto Sans" 更改为优雅的 "EB Garamond" 衬线字体
✅ 参考了 YueYANG1996.github.io 的字体风格

### 2. Publications 功能
✅ **Selected/All Publications 切换**：可以在精选论文和全部论文之间切换
✅ **TLDR 功能**：每篇论文可以添加简短摘要，支持展开/收起
✅ **动态加载**：论文数据从 JSON 文件动态加载
✅ **响应式设计**：支持移动端和桌面端

## 📁 文件结构

```
weikaih04.github.io/
├── _layouts/
│   └── default.html          # 更新：添加了字体和 JS 引用
├── assets/
│   ├── css/
│   │   └── style.scss        # 更新：新字体和 publications 样式
│   └── js/
│       └── publications.js   # 新增：处理论文显示逻辑
├── img/
│   └── papers/               # 存放论文图片
│       ├── sos.png
│       ├── gas.png
│       ├── provision.png
│       ├── tma.png
│       └── mms.png
├── publications.json         # 新增：论文数据文件
├── index.md                  # 新增：新的主页（替代 README.md）
├── test.html                 # 测试页面
└── CHANGES.md               # 改动说明
```

## 🚀 快速开始

### 本地测试

#### 方法 1: 使用 Python 简单服务器（测试 test.html）
```bash
cd /Users/apple/Desktop/CS/weikaih04.github.io
python3 -m http.server 8000
```
然后访问：http://localhost:8000/test.html

#### 方法 2: 使用 Jekyll（完整测试）
```bash
cd /Users/apple/Desktop/CS/weikaih04.github.io
bundle exec jekyll serve
```
然后访问：http://localhost:4000

### 部署到 GitHub Pages

```bash
git add .
git commit -m "Add publications feature with TLDR and Selected/All toggle"
git push origin main
```

等待几分钟后，访问你的 GitHub Pages 网站查看效果。

## ✏️ 如何添加/编辑论文

### 编辑 publications.json

打开 `publications.json` 文件，按照以下格式添加或修改论文：

```json
{
  "publications": [
    {
      "id": "unique-paper-id",           // 唯一标识符
      "title": "论文标题",
      "authors": [                        // 作者列表
        "作者1",
        "Weikai Huang",                   // 你的名字会自动加粗
        "作者3"
      ],
      "venue": "会议/期刊名称",           // 如 "NeurIPS", "CVPR"
      "year": "2025",                     // 年份
      "award": "🏆 Best Paper",          // 可选：奖项
      "image": "img/papers/image.png",   // 论文图片路径
      "links": {                          // 相关链接
        "paper": "论文PDF链接",
        "arxiv": "arXiv链接",
        "code": "GitHub代码链接",
        "website": "项目网站",
        "blog": "博客文章",
        "demo": "在线演示",
        "talk": "演讲视频"
      },
      "selected": true,                   // true=精选论文，false=普通论文
      "tldr": "这里写论文的简短摘要，1-2句话概括论文的主要贡献..."
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 唯一标识符，用于 TLDR 功能 |
| `title` | ✅ | 论文标题 |
| `authors` | ✅ | 作者列表，包含 "Weikai Huang" 的会自动加粗 |
| `venue` | ✅ | 会议/期刊名称 |
| `year` | ✅ | 发表年份 |
| `award` | ❌ | 奖项（可选），如 "🏆 Best Paper" |
| `image` | ❌ | 论文图片路径（推荐添加） |
| `links` | ❌ | 相关链接对象 |
| `selected` | ✅ | 是否为精选论文（true/false） |
| `tldr` | ❌ | 论文摘要（可选），设为 null 则不显示 |

### 添加论文图片

1. 将论文的代表性图片保存到 `img/papers/` 目录
2. 推荐尺寸：宽度 400-600px
3. 支持格式：PNG, JPG, GIF
4. 在 JSON 中引用：`"image": "img/papers/your-image.png"`

## 🎨 样式自定义

### 修改主题色

编辑 `assets/css/style.scss`，找到以下部分并修改颜色：

```scss
.view-toggle button.active {
  background: #2563eb;  // 主题蓝色
  color: white;
  border-color: #2563eb;
}

.publication-title a:hover {
  color: #2563eb;  // 链接悬停颜色
}
```

### 修改字体大小

在 `assets/css/style.scss` 中修改：

```scss
body {
  font-size: 18px;  // 基础字体大小
}

.publication-title {
  font-size: 1.15rem;  // 标题字体大小
}
```

## 🔧 故障排除

### 问题 1: Publications 不显示

**可能原因**：
- JSON 文件格式错误
- 路径不正确
- JavaScript 未加载

**解决方法**：
1. 检查浏览器控制台（F12）是否有错误
2. 验证 `publications.json` 格式是否正确（使用 JSONLint）
3. 确认 `assets/js/publications.js` 已正确引用

### 问题 2: TLDR 按钮不工作

**可能原因**：
- JavaScript 函数未正确加载
- 论文 ID 重复

**解决方法**：
1. 确保每篇论文的 `id` 字段唯一
2. 检查浏览器控制台是否有 JavaScript 错误

### 问题 3: 图片不显示

**可能原因**：
- 图片路径错误
- 图片文件不存在

**解决方法**：
1. 检查图片路径是否正确
2. 确认图片文件存在于 `img/papers/` 目录
3. 使用相对路径：`img/papers/image.png`

## 📱 移动端优化

网站已经包含移动端响应式设计：

- 小于 768px：论文卡片变为单列布局
- 图片自动调整大小
- 按钮和链接增大触摸区域

## 🌟 最佳实践

1. **精选论文**：将最重要的 3-5 篇论文设为 `"selected": true`
2. **TLDR 长度**：保持在 1-2 句话，约 100-150 字
3. **图片质量**：使用清晰的论文配图，避免过大的文件
4. **链接完整性**：定期检查链接是否有效
5. **作者名称**：确保你的名字拼写一致，以便自动加粗

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台（F12）的错误信息
2. 检查 `CHANGES.md` 了解所有改动
3. 参考 `test.html` 查看独立的测试页面
4. 对比 `YueYANG1996.github.io` 的实现

## 🎉 下一步

现在你可以：
1. ✅ 在 `test.html` 中预览效果
2. ✅ 编辑 `publications.json` 添加更多论文
3. ✅ 自定义样式和颜色
4. ✅ 部署到 GitHub Pages

祝你使用愉快！🚀

