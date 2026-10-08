import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('pages/admin-dashboard.html', 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost:3000/pages/admin-dashboard.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});

const { window } = dom;

// Polyfill real browser APIs
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
globalThis.window = window;
globalThis.document = window.document;
globalThis.sessionStorage = window.sessionStorage;
globalThis.localStorage = window.localStorage;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.Image = window.Image;

// Completely clear storage to simulate fresh user browser
window.localStorage.clear();
window.sessionStorage.clear();

console.log('Testing initAdminDashboard() with completely EMPTY storage...');

try {
  const { initAdminDashboard } = await import('./js/admin.js');
  await initAdminDashboard();
  console.log('initAdminDashboard executed without throwing!');

  // Now test clicking EVERY single nav item
  const navItems = window.document.querySelectorAll('.admin-nav-item');
  console.log(`Found ${navItems.length} nav items.`);
  navItems.forEach(item => {
    const view = item.getAttribute('data-view');
    console.log(`Clicking nav item: [${view}]`);
    item.click();
    console.log(`  Successfully clicked [${view}]!`);
  });

  console.log('All nav clicks succeeded without errors!');
} catch (err) {
  console.error('CRASHED DURING INIT OR CLICK:', err);
  process.exit(1);
}
