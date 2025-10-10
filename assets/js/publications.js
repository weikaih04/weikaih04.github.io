// Load publications from JSON
let publicationsData = [];
let showSelected = true;
let metricsCache = {}; // Cache for GitHub stars and citations

async function loadPublications() {
    try {
        // Try multiple possible paths for the JSON file
        let response;
        const possiblePaths = [
            'publications.json',
            '/publications.json',
            './publications.json'
        ];

        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                continue;
            }
        }

        if (!response || !response.ok) {
            throw new Error('Could not load publications.json');
        }

        const data = await response.json();
        publicationsData = data.publications;
        displayPublications();

        // Fetch metrics asynchronously after initial display
        fetchAllMetrics();
    } catch (error) {
        console.error('Error loading publications:', error);
        // Show error message to user
        const container = document.getElementById('publicationsList');
        if (container) {
            container.innerHTML = '<p style="color: #dc2626;">Error loading publications. Please check the console for details.</p>';
        }
    }
}

// Extract GitHub repo owner and name from URL
function parseGitHubUrl(url) {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}

// Fetch GitHub stars for a repository
async function fetchGitHubStars(repoUrl) {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) return null;

    try {
        const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.stargazers_count;
    } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        return null;
    }
}

// Extract arXiv ID from URL
function parseArxivId(url) {
    if (!url) return null;
    const match = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
    return match ? match[1] : null;
}

// Fetch citation count from Semantic Scholar
async function fetchSemanticScholarCitations(pub) {
    // Try to get paper ID from arXiv
    const arxivId = parseArxivId(pub.links?.arxiv);

    if (!arxivId) return null;

    try {
        const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=citationCount`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.citationCount;
    } catch (error) {
        console.error('Error fetching Semantic Scholar citations:', error);
        return null;
    }
}

// Fetch all metrics for all publications
async function fetchAllMetrics() {
    for (const pub of publicationsData) {
        const pubId = pub.id;

        // Fetch GitHub stars if code link exists
        if (pub.links?.code) {
            const stars = await fetchGitHubStars(pub.links.code);
            if (stars !== null) {
                metricsCache[`${pubId}_stars`] = stars;
                updateMetricsDisplay(pubId);
            }
        }

        // Fetch citations if arXiv link exists
        if (pub.links?.arxiv) {
            const citations = await fetchSemanticScholarCitations(pub);
            if (citations !== null) {
                metricsCache[`${pubId}_citations`] = citations;
                updateMetricsDisplay(pubId);
            }
        }
    }
}

// Update the metrics display for a specific publication
function updateMetricsDisplay(pubId) {
    const stars = metricsCache[`${pubId}_stars`];
    const citations = metricsCache[`${pubId}_citations`];

    // Update stars in the venue line
    if (stars !== undefined) {
        const starsElement = document.getElementById(`stars-${pubId}`);
        if (starsElement) {
            starsElement.textContent = ` (⭐ ${formatNumber(stars)})`;
        }
    }

    // Update citations in the venue line
    if (citations !== undefined) {
        const citationsElement = document.getElementById(`citations-${pubId}`);
        if (citationsElement) {
            citationsElement.textContent = ` (${formatNumber(citations)} citations)`;
        }
    }
}

// Format large numbers with K suffix
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function displayPublications() {
    const container = document.getElementById('publicationsList');
    if (!container) return;
    
    const publications = showSelected 
        ? publicationsData.filter(pub => pub.selected) 
        : publicationsData;
    
    container.innerHTML = publications.map(pub => createPublicationHTML(pub)).join('');
}

function createPublicationHTML(pub) {
    const authorsHtml = pub.authors.map(author =>
        author.includes('Weikai Huang') ? `<strong>${author}</strong>` : author
    ).join(', ');

    // Create links with better labels and ordering
    const linkOrder = ['paper', 'arxiv', 'website', 'code', 'huggingface', 'demo', 'blog', 'talk', 'data', 'models'];
    const linkLabels = {
        'paper': 'Paper',
        'arxiv': 'arXiv',
        'website': 'Website',
        'code': 'Code',
        'huggingface': 'HuggingFace',
        'demo': 'Demo',
        'blog': 'Blog',
        'talk': 'Talk',
        'data': 'Data',
        'models': 'Models'
    };

    const linksHtml = linkOrder
        .filter(key => pub.links && pub.links[key])
        .map(key => {
            const label = linkLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
            // Add metrics placeholder after Code and Paper/arXiv links
            let metricPlaceholder = '';
            if (key === 'code') {
                metricPlaceholder = `<span id="stars-${pub.id}" class="metric-inline"></span>`;
            } else if (key === 'paper' || key === 'arxiv') {
                metricPlaceholder = `<span id="citations-${pub.id}" class="metric-inline"></span>`;
            }
            return `<a href="${pub.links[key]}" target="_blank">${label}</a>${metricPlaceholder}`;
        })
        .join('');

    const imageHtml = pub.image
        ? `<div class="publication-image">
               <img src="${pub.image}" alt="${pub.title}">
           </div>`
        : '';

    const awardHtml = pub.award ? `<span class="award">${pub.award}</span>` : '';

    // Additional venue (e.g., workshop)
    const additionalVenueHtml = pub.additional_venue ? `<br><span style="color: #5a5a5a; font-size: 1rem;">${pub.additional_venue}</span>` : '';

    // Highlight (e.g., used in BLIP-3)
    const highlightHtml = pub.highlight ? `<div class="publication-highlight">${pub.highlight}</div>` : '';

    // Create expandable TL;DR with unique ID
    const tldrHtml = pub.tldr ? `
        <div class="publication-tldr collapsed" id="tldr-${pub.id}">
            <div class="tldr-content">
                <strong>TL;DR:</strong> ${pub.tldr}
            </div>
            <button class="tldr-toggle" onclick="toggleTldr('${pub.id}')" aria-label="Expand">
                <span class="toggle-text">more</span>
                <svg class="toggle-icon" width="12" height="12" viewBox="0 0 12 12">
                    <path d="M6 9L3 6h6z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    ` : '';

    return `
        <div class="publication-item">
            ${imageHtml}
            <div class="publication-content">
                <div class="publication-title">
                    <a href="${pub.links?.paper || pub.links?.arxiv || pub.links?.website || '#'}" target="_blank">${pub.title}</a>
                </div>
                <div class="publication-authors">${authorsHtml}</div>
                <div class="publication-venue">
                    <strong>${pub.venue}</strong> ${pub.year} ${awardHtml}${additionalVenueHtml}
                </div>
                ${linksHtml ? `<div class="publication-links">${linksHtml}</div>` : ''}
                ${tldrHtml}
                ${highlightHtml}
            </div>
        </div>
    `;
}

// Toggle TL;DR expansion
function toggleTldr(pubId) {
    const tldrElement = document.getElementById(`tldr-${pubId}`);
    if (!tldrElement) return;
    
    const isCollapsed = tldrElement.classList.contains('collapsed');
    
    if (isCollapsed) {
        tldrElement.classList.remove('collapsed');
        tldrElement.classList.add('expanded');
        const toggleBtn = tldrElement.querySelector('.tldr-toggle .toggle-text');
        if (toggleBtn) toggleBtn.textContent = 'less';
    } else {
        tldrElement.classList.add('collapsed');
        tldrElement.classList.remove('expanded');
        const toggleBtn = tldrElement.querySelector('.tldr-toggle .toggle-text');
        if (toggleBtn) toggleBtn.textContent = 'more';
    }
}

// Toggle between selected and all publications
document.addEventListener('DOMContentLoaded', () => {
    loadPublications();
    
    const selectedBtn = document.getElementById('selectedBtn');
    const allBtn = document.getElementById('allBtn');
    
    if (selectedBtn && allBtn) {
        selectedBtn.addEventListener('click', () => {
            showSelected = true;
            selectedBtn.classList.add('active');
            allBtn.classList.remove('active');
            displayPublications();
        });
        
        allBtn.addEventListener('click', () => {
            showSelected = false;
            allBtn.classList.add('active');
            selectedBtn.classList.remove('active');
            displayPublications();
        });
    }
});

