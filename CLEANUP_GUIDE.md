# 文件清理指南

## ✅ 已删除的文件

- ✅ **README_flexbox.md** - 旧的备份文件（已删除）
- ✅ **test.html** - 测试文件（已删除）

## 📝 已更新的文件

- ✅ **README.md** - 已更新为项目说明文档（GitHub 仓库页面会显示）

## 🤔 可选删除的文件/目录

### YueYANG1996.github.io/ 目录

**用途**: 参考网站的源代码

**建议**: 
- 🟡 **暂时保留** - 如果你将来还想参考样式或功能
- 🔴 **可以删除** - 如果你确定不再需要参考

**删除命令**:
```bash
rm -rf YueYANG1996.github.io
```

**大小**: 约占用一定空间，但不影响网站运行

### .DS_Store 文件

**用途**: macOS 系统文件（无用）

**建议**: 🔴 **删除并添加到 .gitignore**

**删除命令**:
```bash
# 删除现有的 .DS_Store
find . -name ".DS_Store" -delete

# 添加到 .gitignore
echo ".DS_Store" >> .gitignore
```

## 📋 当前文件结构

### 核心文件（必须保留）
```
✅ _config.yml           # Jekyll 配置
✅ _layouts/             # 页面布局
✅ assets/               # CSS 和 JS
✅ img/                  # 图片资源
✅ publications.json     # 论文数据
✅ index.md              # 主页
✅ cv.md                 # CV 页面
✅ files/                # 文件资源
```

### 文档文件（建议保留）
```
✅ README.md             # 项目说明（GitHub 显示）
✅ USAGE_GUIDE.md        # 使用指南
✅ CHANGES.md            # 改动说明
✅ CLEANUP_GUIDE.md      # 本文件
```

### 可选文件
```
🟡 YueYANG1996.github.io/  # 参考网站（可删除）
🔴 .DS_Store               # 系统文件（应删除）
```

## 🧹 推荐的清理步骤

### 步骤 1: 删除系统文件
```bash
# 删除所有 .DS_Store 文件
find . -name ".DS_Store" -delete

# 添加到 .gitignore（如果还没有）
echo ".DS_Store" >> .gitignore
```

### 步骤 2: 测试网站
```bash
# 本地测试
bundle exec jekyll serve

# 或使用 Python
python3 -m http.server 8000
```

### 步骤 3: 确认功能正常后，删除参考目录（可选）
```bash
# 只有在确认网站完全正常后才执行
rm -rf YueYANG1996.github.io
```

### 步骤 4: 提交更改
```bash
git add .
git commit -m "Clean up old files and update documentation"
git push origin main
```

## 📊 清理前后对比

### 清理前
```
总文件数: ~100+ 文件
主要占用: YueYANG1996.github.io/ 目录
```

### 清理后（如果删除参考目录）
```
总文件数: ~50 文件
减少: ~50% 文件数量
保留: 所有必要的功能文件
```

## ⚠️ 注意事项

1. **不要删除**:
   - `_layouts/` - 页面布局必需
   - `assets/` - CSS 和 JS 必需
   - `img/` - 图片资源必需
   - `publications.json` - 论文数据必需
   - `index.md` - 主页必需

2. **可以删除**:
   - `.DS_Store` - 系统文件
   - `YueYANG1996.github.io/` - 参考目录（确认后）

3. **建议保留**:
   - `README.md` - GitHub 仓库说明
   - `USAGE_GUIDE.md` - 使用指南
   - `CHANGES.md` - 改动记录

## 🎯 最终建议

### 立即执行
```bash
# 删除系统文件
find . -name ".DS_Store" -delete
echo ".DS_Store" >> .gitignore
```

### 测试后执行（可选）
```bash
# 确认网站正常运行后
rm -rf YueYANG1996.github.io
```

### 长期维护
- 定期检查并删除不需要的文件
- 保持 `publications.json` 更新
- 更新文档以反映最新变化

## 📞 需要帮助？

如果不确定是否应该删除某个文件：
1. 先备份整个项目
2. 在本地测试删除效果
3. 确认网站功能正常
4. 再提交到 GitHub

---

**记住**: 删除前先测试，确保网站功能正常！

