#!/usr/bin/env python3
"""
Fetch GitHub stars and Semantic Scholar citations for publications.
This script updates publications.json with the latest metrics.
"""

import json
import requests
import time
import re
from typing import Optional

def extract_github_repo(url: str) -> Optional[tuple]:
    """Extract owner and repo from GitHub URL."""
    if not url:
        return None
    match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
    if match:
        return match.group(1), match.group(2)
    return None

def fetch_github_stars(repo_url: str) -> Optional[int]:
    """Fetch star count from GitHub API."""
    repo_info = extract_github_repo(repo_url)
    if not repo_info:
        return None
    
    owner, repo = repo_info
    # Remove .git suffix if present
    repo = repo.replace('.git', '')
    
    try:
        url = f'https://api.github.com/repos/{owner}/{repo}'
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('stargazers_count')
        else:
            print(f"  ⚠️  GitHub API error for {owner}/{repo}: {response.status_code}")
            return None
    except Exception as e:
        print(f"  ❌ Error fetching GitHub stars for {owner}/{repo}: {e}")
        return None

def extract_arxiv_id(url: str) -> Optional[str]:
    """Extract arXiv ID from URL."""
    if not url:
        return None
    match = re.search(r'arxiv\.org/abs/(\d+\.\d+)', url)
    return match.group(1) if match else None

def fetch_semantic_scholar_citations(arxiv_url: str) -> Optional[int]:
    """Fetch citation count from Semantic Scholar API."""
    arxiv_id = extract_arxiv_id(arxiv_url)
    if not arxiv_id:
        return None
    
    try:
        url = f'https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}?fields=citationCount'
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('citationCount')
        else:
            print(f"  ⚠️  Semantic Scholar API error for arXiv:{arxiv_id}: {response.status_code}")
            return None
    except Exception as e:
        print(f"  ❌ Error fetching citations for arXiv:{arxiv_id}: {e}")
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
        
        links = pub.get('links', {})
        metrics_updated = False
        
        # Fetch GitHub stars
        if 'code' in links:
            print(f"  🔍 Fetching GitHub stars...")
            stars = fetch_github_stars(links['code'])
            if stars is not None:
                pub['github_stars'] = stars
                print(f"  ⭐ {stars} stars")
                metrics_updated = True
            time.sleep(0.5)  # Be nice to the API
        
        # Fetch citations
        if 'arxiv' in links:
            print(f"  🔍 Fetching citations...")
            citations = fetch_semantic_scholar_citations(links['arxiv'])
            if citations is not None:
                pub['citations'] = citations
                print(f"  📖 {citations} citations")
                metrics_updated = True
            else:
                # Keep existing citations if API fails
                if 'citations' in pub:
                    print(f"  ⚠️  API failed, keeping existing citations: {pub['citations']}")
                else:
                    print(f"  ⚠️  No citations found")
            time.sleep(0.5)  # Be nice to the API
        
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

