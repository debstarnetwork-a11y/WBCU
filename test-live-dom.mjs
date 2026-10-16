import { JSDOM } from 'jsdom';

console.log('Fetching http://localhost:3000/pages/admin-dashboard.html through Vite...');

JSDOM.fromURL('http://localhost:3000/pages/admin-dashboard.html', {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true
}).then(dom => {
  const { window } = dom;

  // Catch all errors in the simulated page
  window.addEventListener('error', (e) => {
    console.error('>>> [PAGE WINDOW ERROR]:', e.message, e.filename, e.lineno, e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('>>> [UNHANDLED REJECTION]:', e.reason);
  });

  // Polyfills
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    fillText: () => {},
    measureText: () => ({ width: 10 }),
    scale: () => {},
    roundRect: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} })
  });

  setTimeout(() => {
    console.log('Testing after 3 seconds...');
    console.log('Document readyState:', window.document.readyState);
    console.log('window.initAdminDashboard exists?', typeof window.initAdminDashboard);
    
    // Check if clicking sidebar nav items works
    const navItems = window.document.querySelectorAll('.admin-nav-item');
    console.log('Found nav items:', navItems.length);
    for (const item of navItems) {
      const view = item.getAttribute('data-view');
      item.click();
      console.log(`Clicked [${view}]:`);
      const sec = window.document.getElementById('section-' + view);
      if (sec) {
        console.log(`  section-${view} display:`, sec.style.display);
      } else {
        const usersSec = window.document.getElementById('section-users');
        const txSec = window.document.getElementById('section-transactions');
        console.log(`  users display: ${usersSec?.style.display}, tx display: ${txSec?.style.display}`);
      }
    }

    process.exit(0);
  }, 3500);
}).catch(err => {
  console.error('JSDOM load error:', err);
  process.exit(1);
});
