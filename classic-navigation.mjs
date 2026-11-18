// Frozen assets stay in the snapshot; navigation keeps using live canonical routes.
const live = new URL('./', import.meta.url);
const frozen = new URL('../listening-classic-20261117/', live);
function updateLinks() {
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), document.baseURI);
    if (url.origin !== frozen.origin || !url.pathname.startsWith(frozen.pathname)) continue;
    const file = url.pathname.slice(frozen.pathname.length);
    if (!/^[\w-]+\.html$/.test(file)) continue;
    link.href = new URL(file + url.search + url.hash, live).href;
  }
}
updateLinks();
new MutationObserver(updateLinks).observe(document.documentElement, {
  subtree: true, childList: true, attributes: true, attributeFilter: ['href'],
});
