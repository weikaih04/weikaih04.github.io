# GitHub Stars & Citations Feature

## Overview
Added automatic fetching and display of GitHub repository stars and Semantic Scholar citations for publications.

## Features

### 1. GitHub Stars
- Automatically fetches star count from GitHub API for repositories linked in the `code` field
- Displays as: `⭐ 1.2K` (numbers over 1000 are formatted with K suffix)
- Appears as a badge in the links section, styled like other link badges

### 2. Semantic Scholar Citations
- Automatically fetches citation count from Semantic Scholar API for papers with arXiv links
- Displays as: `📖 45 cite.` (using abbreviation as requested)
- Appears as a badge in the links section, styled like other link badges

## Implementation Details

### Files Modified

#### 1. `assets/js/publications.js`
- Added `metricsCache` object to cache fetched metrics
- Added `parseGitHubUrl()` to extract repo owner/name from GitHub URLs
- Added `fetchGitHubStars()` to fetch star count from GitHub API
- Added `parseArxivId()` to extract arXiv ID from URLs
- Added `fetchSemanticScholarCitations()` to fetch citations from Semantic Scholar API
- Added `fetchAllMetrics()` to fetch all metrics asynchronously after page load
- Added `updateMetricsDisplay()` to update the UI with fetched metrics
- Added `formatNumber()` to format large numbers with K suffix
- Modified `createPublicationHTML()` to include metric placeholders in the links section

#### 2. `assets/css/style.scss`
- Added `.metric-badge` class styled like `.publication-links a` but without hover effects
- Metrics appear as non-clickable badges that blend seamlessly with the existing link badges

## How It Works

1. **Page Load**: Publications are displayed immediately
2. **Cache Check**: System checks localStorage for cached metrics (valid for 24 hours)
3. **Instant Display**: If cache exists and is valid, metrics appear immediately
4. **Background Refresh**: Fresh metrics are fetched in the background to update the cache
5. **API Calls**: Only made when cache is missing or expired:
   - GitHub API: `https://api.github.com/repos/{owner}/{repo}`
   - Semantic Scholar API: `https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxivId}?fields=citationCount`
6. **Cache Update**: New metrics are saved to localStorage with timestamp

## Caching System

### Cache Duration
- **Default**: 24 hours
- **Storage**: Browser's localStorage
- **Keys**:
  - `publications_metrics_cache` - stores the metrics data
  - `publications_metrics_timestamp` - stores the last update time

### Manual Cache Control
You can manually clear the cache in the browser console:
```javascript
clearMetricsCache()
```
Then reload the page to fetch fresh data.

### Benefits
- **Fast Loading**: Metrics appear instantly on repeat visits
- **Reduced API Calls**: Minimizes requests to GitHub and Semantic Scholar
- **Better UX**: No waiting for API responses on cached data
- **Automatic Refresh**: Cache expires after 24 hours to keep data fresh

## User Experience

- **No Configuration Required**: The system automatically detects code and arXiv links from `publications.json`
- **Progressive Enhancement**: Page loads immediately, metrics appear as they're fetched
- **Seamless Integration**: Metrics appear as badges in the links section, matching the existing design
- **No Visual Disruption**: The layout remains unchanged, metrics blend naturally with other links

## Example Display

Before (links section):
```
[Paper] [arXiv] [Website] [Code] [HuggingFace]
```

After (with metrics):
```
[arXiv 📖 45 cite.] [Code ⭐ 1.2K] [Website] [HuggingFace]
```

Note: Metrics appear inside the link badges, and link order is: arXiv, Code, then others.

## API Rate Limits

- **GitHub API**: 60 requests/hour for unauthenticated requests
- **Semantic Scholar API**: No strict rate limit, but recommended to be respectful

## Configuration

To change the cache duration, modify the `CACHE_DURATION` constant in `assets/js/publications.js`:

```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (default)
// Examples:
// 1 hour:  1 * 60 * 60 * 1000
// 12 hours: 12 * 60 * 60 * 1000
// 7 days: 7 * 24 * 60 * 60 * 1000
```

## Future Enhancements

Possible improvements:
1. Add GitHub API token support for higher rate limits
2. Add error handling UI for failed API requests
3. Support for other citation sources (Google Scholar, etc.)
4. Add loading indicators for individual metrics
5. Add option to manually refresh specific metrics

