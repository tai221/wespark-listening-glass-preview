import { activeVersion, screens } from './ui-version.mjs';

const root = new URL('./', import.meta.url);
const screen = document.documentElement.dataset.screen;
try {
  const source = screens[activeVersion]?.[screen];
  if (!source) throw new Error('Unknown Listening UI version or screen');
  const url = new URL(source, root);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load Listening screen (${response.status})`);
  const html = await response.text();
  const base = new URL('./', url);
  const bridge = activeVersion === 'classic'
    ? `<script type="module" src="${new URL('classic-navigation.mjs', root).href}"></script>` : '';
  // Retain the canonical URL, query and hash. Only assets resolve against the selected version.
  document.open();
  document.write(html.replace(/<head>/i, `<head><base href="${base.href}">${bridge}`));
  document.close();
} catch (error) {
  console.error(error);
  document.querySelector('[role="status"]').textContent = 'Chưa mở được bài học. Tải lại trang để thử lại.';
}
