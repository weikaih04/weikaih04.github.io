# 网站更新说明

## 完成的改动

### 1. 字体更新 ✅
- 将网站字体从 "Noto Sans" 改为 "EB Garamond"（参考 YueYANG1996.github.io）
- 添加了 Google Fonts 引用到 `_layouts/default.html`
- 更新了 `assets/css/style.scss` 中的字体设置
- 字体更加优雅，具有学术气质

### 2. Publications 功能 ✅
添加了以下新功能：

#### a) Selected/All Publications 切换按钮
- 可以在 "Selected" 和 "All Publications" 之间切换
- Selected 显示精选论文
- All Publications 显示所有论文

#### b) TLDR 功能
- 每篇论文可以添加 TL;DR（Too Long; Didn't Read）摘要
- TL;DR 默认折叠，点击 "more" 按钮展开
- 点击 "less" 按钮收起

#### c) 动态加载
- 论文数据存储在 `publications.json` 文件中
- 使用 JavaScript 动态加载和显示
- 支持图片、链接、奖项等多种元素

### 3. 新增文件

1. **publications.json** - 论文数据文件
   - 包含所有论文的信息
   - 每篇论文包括：标题、作者、会议、年份、图片、链接、TLDR、是否精选等

2. **assets/js/publications.js** - JavaScript 功能文件
   - 加载和显示论文
   - 处理 Selected/All 切换
   - 处理 TLDR 展开/收起

3. **index.md** - 新的主页文件
   - 替代 README.md
   - 使用新的 publications 格式

### 4. 修改的文件

1. **_layouts/default.html**
   - 添加了 Google Fonts 引用
   - 添加了 publications.js 引用

2. **assets/css/style.scss**
   - 更新了字体设置
   - 添加了 publications 相关样式
   - 添加了 TLDR 样式
   - 添加了移动端响应式设计

## 如何使用

### 添加新论文

编辑 `publications.json` 文件，添加新的论文条目：

```json
{
  "id": "unique-id",
  "title": "论文标题",
  "authors": ["作者1", "Weikai Huang", "作者3"],
  "venue": "会议名称",
  "year": "2025",
  "award": "🏆 Best Paper",  // 可选
  "image": "img/papers/image.png",
  "links": {
    "paper": "链接",
    "arxiv": "链接",
    "code": "链接",
    "website": "链接"
  },
  "selected": true,  // true 表示精选论文
  "tldr": "这里是论文的简短摘要..."  // 可选
}
```

### 测试网站

在本地测试：
```bash
bundle exec jekyll serve
```

然后访问 http://localhost:4000

### 部署到 GitHub Pages

```bash
git add .
git commit -m "Update website with new publications format"
git push origin main
```

## 样式特点

- 优雅的衬线字体（EB Garamond）
- 清晰的论文卡片布局
- 可交互的 TLDR 功能
- 响应式设计，支持移动端
- 平滑的动画过渡效果

## 注意事项

1. 确保所有论文图片都放在 `img/papers/` 目录下
2. 作者名字中包含 "Weikai Huang" 的会自动加粗显示
3. TLDR 是可选的，如果不需要可以设置为 null
4. selected 字段控制论文是否在 "Selected" 视图中显示

