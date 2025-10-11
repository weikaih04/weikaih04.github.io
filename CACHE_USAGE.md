# 缓存使用说明 (Cache Usage Guide)

## 概述

网站现在使用 localStorage 来缓存 GitHub stars 和论文引用数，避免每次访问都调用 API。

## 工作原理

### 首次访问
1. 页面加载，显示论文列表
2. 检查 localStorage，发现没有缓存
3. 调用 GitHub 和 Semantic Scholar API 获取数据
4. 数据显示在页面上
5. 数据保存到 localStorage，带上时间戳

### 再次访问（24小时内）
1. 页面加载，显示论文列表
2. 检查 localStorage，发现有有效缓存
3. **立即显示缓存的数据**（无需等待）
4. 后台仍然会调用 API 更新数据
5. 如果有新数据，更新缓存

### 24小时后访问
1. 页面加载，显示论文列表
2. 检查 localStorage，发现缓存已过期
3. 调用 API 获取最新数据
4. 更新显示和缓存

## 优势

✅ **快速加载** - 有缓存时，metrics 立即显示，无需等待  
✅ **减少 API 调用** - 避免频繁请求，尊重 API 限制  
✅ **更好的用户体验** - 不会每次都看到加载过程  
✅ **自动刷新** - 24小时后自动获取最新数据  

## 手动操作

### 查看缓存状态
在浏览器控制台（F12）输入：
```javascript
// 查看缓存的数据
console.log(localStorage.getItem('publications_metrics_cache'));

// 查看缓存时间
const timestamp = localStorage.getItem('publications_metrics_timestamp');
const date = new Date(parseInt(timestamp));
console.log('Cache created:', date.toLocaleString());

// 查看缓存剩余有效时间
const now = Date.now();
const cacheTime = parseInt(timestamp);
const hoursLeft = (24 - (now - cacheTime) / (1000 * 60 * 60)).toFixed(1);
console.log('Hours until cache expires:', hoursLeft);
```

### 清除缓存
如果你想强制刷新数据（比如刚发布新论文，想立即看到最新的 stars 和 citations）：

在浏览器控制台输入：
```javascript
clearMetricsCache()
```

然后刷新页面（F5 或 Cmd+R）。

### 修改缓存时长

编辑 `assets/js/publications.js` 文件，找到这一行：
```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

修改为你想要的时长：
- 1 小时: `1 * 60 * 60 * 1000`
- 12 小时: `12 * 60 * 60 * 1000`
- 7 天: `7 * 24 * 60 * 60 * 1000`

## 技术细节

### 存储位置
- **浏览器**: localStorage（每个浏览器独立）
- **大小限制**: 通常 5-10MB（足够存储这些数据）
- **持久性**: 除非手动清除或清空浏览器数据，否则永久保存

### 存储的数据
```json
{
  "sos_stars": 1234,
  "sos_citations": 45,
  "gas_stars": 567,
  "gas_citations": 23,
  ...
}
```

### API 调用频率
- **有缓存**: 每24小时调用一次
- **无缓存**: 每次访问调用一次
- **GitHub API 限制**: 60次/小时（未认证）
- **Semantic Scholar**: 无严格限制，但建议合理使用

## 常见问题

### Q: 为什么我看到的数据不是最新的？
A: 如果在24小时内，显示的是缓存数据。可以手动清除缓存强制刷新。

### Q: 缓存会占用多少空间？
A: 非常小，大约几KB。对浏览器存储空间影响可忽略。

### Q: 如果我换了浏览器或设备？
A: 缓存是本地的，换浏览器/设备会重新获取数据。

### Q: 缓存会自动清理吗？
A: 过期的缓存在下次访问时会被新数据覆盖，不需要手动清理。

### Q: 如果 API 调用失败怎么办？
A: 会继续显示缓存的数据（如果有），不会影响页面显示。

## 开发建议

### 测试时
建议使用较短的缓存时间（如5分钟）：
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### 生产环境
建议使用24小时或更长：
```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

对于学术网站，数据不需要实时更新，24小时是合理的选择。

