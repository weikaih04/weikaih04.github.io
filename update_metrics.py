#!/usr/bin/env python3
"""
Fetch GitHub stars and Semantic Scholar citations for publications.
This script updates publications.json with the latest metrics.
"""

import json
import urllib.request
import urllib.error
import time

def fetch_github_stars(repo):
    """Fetch star count from GitHub API."""
    try:
        url = f'https://api.github.com/repos/{repo}'
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get('stargazers_count')
    except Exception as e:
        print(f"  ⚠️  Error fetching GitHub stars for {repo}: {e}")
        return None

def fetch_citations(arxiv_id):
    """Fetch citation count from Semantic Scholar API."""
    try:
        url = f'https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}?fields=citationCount'
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get('citationCount')
    except Exception as e:
        print(f"  ⚠️  Error fetching citations for arXiv:{arxiv_id}: {e}")
        return None

def main():
    """Main function to update publications.json with metrics."""
    print("📊 Fetching metrics for publications...\n")
    
    # Load publications.json
    try:
        with open('publications.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ publications.json not found!")
        return
    
    publications = data.get('publications', [])
    updated_count = 0
    
    for pub in publications:
        pub_id = pub.get('id', 'unknown')
        title = pub.get('title', 'Unknown')
        print(f"📄 {title}")
        
        metrics_updated = False
        
        # Fetch GitHub stars
        github_repo = pub.get('github_repo')
        if github_repo:
            print(f"  🔍 Fetching GitHub stars for {github_repo}...")
            stars = fetch_github_stars(github_repo)
            if stars is not None:
                pub['github_stars'] = stars
                print(f"  ⭐ {stars} stars")
                metrics_updated = True
            time.sleep(1)  # Be nice to the API

        # Fetch citations
        arxiv_id = pub.get('arxiv_id')
        if arxiv_id and not arxiv_id.endswith('xxxxx'):  # Skip placeholder IDs
            print(f"  🔍 Fetching citations for arXiv:{arxiv_id}...")
            citations = fetch_citations(arxiv_id)
            if citations is not None:
                pub['citations'] = citations
                print(f"  📖 {citations} citations")
                metrics_updated = True
            time.sleep(3)  # Semantic Scholar has strict rate limits
        
        if metrics_updated:
            updated_count += 1
        print()
    
    # Save updated publications.json
    try:
        with open('publications.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Updated {updated_count} publications in publications.json")
    except Exception as e:
        print(f"❌ Error saving publications.json: {e}")

if __name__ == '__main__':
    main()

