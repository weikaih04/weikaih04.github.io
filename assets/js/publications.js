// Load publications from JSON
let publicationsData = [];
let showSelected = true;

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

        // Display pre-fetched metrics from JSON
        displayPreFetchedMetrics();

        // Optionally fetch fresh metrics in background (commented out to save API calls)
        // Uncomment if you want to fetch fresh data on every page load
        // fetchAllMetrics();
    } catch (error) {
        console.error('Error loading publications:', error);
        // Show error message to user
        const container = document.getElementById('publicationsList');
        if (container) {
            container.innerHTML = '<p style="color: #dc2626;">Error loading publications. Please check the console for details.</p>';
        }
    }
}

// Fetch GitHub stars
async function fetchGitHubStars(repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.stargazers_count;
    } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        return null;
    }
}

// Fetch Semantic Scholar citations
async function fetchCitations(arxivId) {
    try {
        const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=citationCount`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.citationCount;
    } catch (error) {
        console.error('Error fetching citations:', error);
        return null;
    }
}

// Format number with K suffix
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Display pre-fetched metrics from publications.json
function displayPreFetchedMetrics() {
    for (const pub of publicationsData) {
        // Display GitHub stars if available
        if (pub.github_stars !== undefined) {
            const starsElement = document.getElementById(`stars-${pub.id}`);
            if (starsElement) {
                starsElement.textContent = ` ⭐ ${formatNumber(pub.github_stars)}`;
            }
        }

        // Display citations if available
        // COMMENTED OUT: Don't display citations
        // if (pub.citations !== undefined) {
        //     const citationsElement = document.getElementById(`citations-${pub.id}`);
        //     if (citationsElement) {
        //         citationsElement.textContent = ` 📖 ${formatNumber(pub.citations)} cite.`;
        //     }
        // }
    }
}

// Fetch all metrics (for manual refresh or fallback)
async function fetchAllMetrics() {
    for (const pub of publicationsData) {
        // Fetch GitHub stars
        if (pub.github_repo) {
            const stars = await fetchGitHubStars(pub.github_repo);
            if (stars !== null) {
                const starsElement = document.getElementById(`stars-${pub.id}`);
                if (starsElement) {
                    starsElement.textContent = ` ⭐ ${formatNumber(stars)}`;
                }
            }
        }

        // Fetch citations
        if (pub.arxiv_id) {
            const citations = await fetchCitations(pub.arxiv_id);
            if (citations !== null) {
                const citationsElement = document.getElementById(`citations-${pub.id}`);
                if (citationsElement) {
                    citationsElement.textContent = ` 📖 ${formatNumber(citations)} cite.`;
                }
            }
        }
    }
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
    // Order: arXiv first, then Code, then others
    const linkOrder = ['arxiv', 'code', 'paper', 'website', 'huggingface', 'demo', 'blog', 'talk', 'data', 'models'];
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
            // Add metric placeholder for text-based display
            let metricSpan = '';

            if (key === 'code' && pub.github_repo) {
                // GitHub stars placeholder
                metricSpan = `<span id="stars-${pub.id}" class="metric-inline"></span>`;
            }
            // COMMENTED OUT: Don't display citations placeholder
            // else if ((key === 'arxiv' || key === 'paper') && pub.arxiv_id) {
            //     // Citations placeholder
            //     metricSpan = `<span id="citations-${pub.id}" class="metric-inline"></span>`;
            // }

            return `<a href="${pub.links[key]}" target="_blank">${label}${metricSpan}</a>`;
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

