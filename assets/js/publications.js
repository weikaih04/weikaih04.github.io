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
        setPublicationView(showSelected);
        revealPublicationFromHash();

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

    // Filtering preserves the source order within each category. Older entries
    // without category metadata belong to Vision.
    container.innerHTML = `<div class="publication-categories">${['Robotics', 'Vision'].map(category => {
        const headingId = `publication-category-${category.toLowerCase()}`;
        const papers = publications.filter(pub => (pub.category === 'Robotics' ? 'Robotics' : 'Vision') === category);
        return `<section class="publication-category" aria-labelledby="${headingId}">
            <h3 id="${headingId}">${category}</h3>
            ${papers.map(pub => createPublicationHTML(pub)).join('')}
        </section>`;
    }).join('')}</div>`;
    applyVideoPlaybackRates(container);
}

// Both categories use the same filter and retain metrics after every render.
function setPublicationView(selected) {
    showSelected = selected;
    for (const [id, active] of [['selectedBtn', selected], ['allBtn', !selected]]) {
        const button = document.getElementById(id);
        if (!button) continue;
        if (active) button.classList.add('active');
        else button.classList.remove('active');
        button.setAttribute('aria-pressed', String(active));
    }
    displayPublications();
    displayPreFetchedMetrics();
}

// Publication anchors also work before JSON loads and for unselected papers.
function revealPublicationFromHash(hash = window.location.hash) {
    if (!hash.startsWith('#pub-')) return;
    const pub = publicationsData.find(pub => `#pub-${pub.id}` === hash);
    if (!pub) return;
    if (showSelected && !pub.selected) setPublicationView(false);
    const card = document.getElementById(`pub-${pub.id}`);
    if (card) card.scrollIntoView({ block: 'start' });
}

// Apply data-playback-rate to <video> elements. Browser resets playbackRate to 1
// on metadata load and on each loop, so we reapply on those events.
function applyVideoPlaybackRates(root) {
    const videos = root.querySelectorAll('video[data-playback-rate]');
    videos.forEach(video => {
        const rate = parseFloat(video.dataset.playbackRate);
        if (!isFinite(rate) || rate <= 0) return;
        const setRate = () => { video.playbackRate = rate; };
        setRate();
        video.addEventListener('loadedmetadata', setRate);
        video.addEventListener('play', setRate);
        video.addEventListener('ratechange', () => {
            if (Math.abs(video.playbackRate - rate) > 0.01) setRate();
        });
    });
}

function createPublicationHTML(pub) {
    const formatAuthor = (author) => author.replace(
        /§/g,
        '<sup class="author-contribution-mark">&sect;</sup>'
    );
    const authorsHtml = pub.authors.map(author => {
        const formattedAuthor = formatAuthor(author);
        return author.includes('Weikai Huang') ? `<strong>${formattedAuthor}</strong>` : formattedAuthor;
    }).join(', ');

    // Create links with better labels and ordering
    // Order: arXiv first, then Code, then others
    const linkOrder = ['arxiv', 'code', 'eval', 'paper', 'video', 'website', 'huggingface', 'demo', 'blog', 'talk', 'data', 'models'];
    const linkLabels = {
        'paper': 'Paper',
        'video': 'Video',
        'arxiv': 'arXiv',
        'website': 'Website',
        'code': 'Code',
        'eval': 'Eval',
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

    // Support local autoplay video, YouTube embeds, and static images
    let imageHtml = '';
    if (pub.local_video) {
        const rate = pub.playback_rate || 3;
        imageHtml = `<div class="publication-image publication-video">
                       <video class="publication-card__video"
                              src="${pub.local_video}"
                              autoplay muted loop playsinline webkit-playsinline
                              disablepictureinpicture
                              preload="metadata"
                              data-playback-rate="${rate}"
                              aria-label="${pub.title} teaser video">
                       </video>
                     </div>`;
    } else if (pub.video) {
        // Extract YouTube video ID from URL
        let videoId = '';
        if (pub.video.includes('youtube.com') || pub.video.includes('youtu.be')) {
            const urlParams = new URLSearchParams(new URL(pub.video).search);
            videoId = urlParams.get('v') || pub.video.split('/').pop().split('?')[0];
        }
        if (videoId) {
            imageHtml = `<div class="publication-image publication-video">
                           <iframe
                             src="https://www.youtube.com/embed/${videoId}"
                             frameborder="0"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowfullscreen>
                           </iframe>
                         </div>`;
        }
    } else if (pub.image) {
        // Add special class for SOS paper to use cover instead of contain
        const imageClass = pub.id === 'sos' ? 'publication-image image-cover' : 'publication-image';
        imageHtml = `<div class="${imageClass}">
                       <img src="${pub.image}" alt="${pub.title}">
                     </div>`;
    }

    const awardHtml = pub.award ? ` (<span style="color: #b91c1c;">${pub.award}</span>)` : '';

    // Additional venue (e.g., workshop)
    const additionalVenueHtml = pub.additional_venue ? `<br>& ${pub.additional_venue.replace(/\(Oral\)/g, '(<span style="color: #b91c1c;">Oral</span>)')}` : '';

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
        <div class="publication-item" id="pub-${pub.id}">
            ${imageHtml}
            <div class="publication-content">
                <div class="publication-title">
                    <a href="${pub.links?.paper || pub.links?.arxiv || pub.links?.website || '#'}" target="_blank">${pub.title}</a>
                </div>
                <div class="publication-authors">${authorsHtml}</div>
                <div class="publication-venue">
                    <strong>${pub.venue}</strong> ${pub.year}${pub.oral ? ' (<span style="color: #b91c1c;">Oral</span>)' : ''} ${awardHtml}${additionalVenueHtml}
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
            setPublicationView(true);
        });
        
        allBtn.addEventListener('click', () => {
            setPublicationView(false);
        });
    }
});

window.addEventListener('hashchange', () => revealPublicationFromHash());
// Clicking an already-current hash does not fire hashchange. Reveal the card
// here as well, so biography links still work after selecting the default view.
document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#pub-"]');
    if (link) revealPublicationFromHash(link.getAttribute('href'));
});

