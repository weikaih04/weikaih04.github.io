// Collapse the News list to the most recent items; "Show all" reveals the rest.
// The visible count lives in CSS (.news-list.is-collapsed li:nth-child(n+6)).
(function () {
    const VISIBLE = 5;
    const heading = Array.from(document.querySelectorAll('h2'))
        .find(h => /^news/i.test(h.textContent.trim()));
    const list = heading && heading.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    const total = list.children.length;
    if (total <= VISIBLE) return;

    list.classList.add('news-list', 'is-collapsed');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'news-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    const label = expanded => expanded ? 'Show fewer' : `Show all news (${total})`;
    toggle.textContent = label(false);

    toggle.addEventListener('click', () => {
        const expanded = list.classList.toggle('is-collapsed') === false;
        toggle.textContent = label(expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        if (!expanded) heading.scrollIntoView({ block: 'start' });
    });

    list.after(toggle);
})();
