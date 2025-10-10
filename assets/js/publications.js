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
    } catch (error) {
        console.error('Error loading publications:', error);
        // Show error message to user
        const container = document.getElementById('publicationsList');
        if (container) {
            container.innerHTML = '<p style="color: #dc2626;">Error loading publications. Please check the console for details.</p>';
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
    
    // Create links with icons
    const linksHtml = Object.entries(pub.links || {})
        .map(([key, url]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return `<a href="${url}" target="_blank">${label}</a>`;
        })
        .join('');
    
    const imageHtml = pub.image 
        ? `<div class="publication-image">
               <img src="${pub.image}" alt="${pub.title}">
           </div>`
        : '';
    
    const awardHtml = pub.award ? `<span class="award">${pub.award}</span>` : '';

    // Additional venue (e.g., workshop)
    const additionalVenueHtml = pub.additional_venue ? `<br><span style="color: #6b7280; font-size: 1rem;">${pub.additional_venue}</span>` : '';

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

