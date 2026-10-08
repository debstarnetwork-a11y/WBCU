/**
 * ============================================================================
 * WB CREDIT UNION - SHARED HEADER & FOOTER NAVIGATION INJECTOR (js/navigation.js)
 * ============================================================================
 */

import { initI18n, createLanguageSwitcherHtml, initLanguageSwitcherEvents, t } from './i18n.js';
import './live-chat.js';

export function injectHeaderAndFooter() {
  const headerContainer = document.getElementById('site-header');
  const footerContainer = document.getElementById('site-footer');

  // 1. INJECT SITE HEADER
  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="site-navbar" id="mainHeader">
        <div class="container nav-container">
          <!-- Brand Logo -->
          <a href="/" class="brand-logo" aria-label="WB Credit Union Home">
            <img src="https://i.ibb.co/svKRSV69/WBCU-LOGO-03.png" alt="WB Credit Union Logo" style="height: 40px; width: auto; max-width: 220px; object-fit: contain;">
          </a>

          <!-- Desktop Navigation Links -->
          <nav class="nav-menu" id="navMenu" aria-label="Main Navigation">
            <a href="/" class="nav-link" id="navLinkHome" data-i18n="nav.home">Home</a>
            <a href="/about.html" class="nav-link" id="navLinkAbout" data-i18n="nav.about">About Us</a>
            <a href="/services.html" class="nav-link" id="navLinkServices" data-i18n="nav.services">Services</a>
            <a href="/contact.html" class="nav-link" id="navLinkContact" data-i18n="nav.contact">Contact</a>
            <div class="mobile-nav-ctas">
              <div class="mobile-lang-wrap mb-2">
                ${createLanguageSwitcherHtml('Mobile')}
              </div>
              <a href="/pages/login.html" class="btn btn-outline btn-block" data-i18n="nav.login">Login to Banking</a>
              <a href="/pages/register.html" class="btn btn-primary btn-block" data-i18n="nav.open_account">Open Account Today</a>
            </div>
          </nav>

          <!-- Right Actions (Language, Theme Toggle, Login, Open Account) -->
          <div class="nav-actions">
            <!-- Language Switcher Dropdown -->
            ${createLanguageSwitcherHtml('Desktop')}

            <!-- Theme Toggle Button -->
            <button type="button" class="theme-toggle-btn" id="headerThemeToggle" aria-label="Toggle light/dark theme" title="Toggle Theme">
              <svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              <svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </button>
            <a href="/pages/login.html" class="btn btn-outline btn-sm" data-i18n="nav.login">Login to Banking</a>
            <a href="/pages/register.html" class="btn btn-orange btn-sm" data-i18n="nav.open_account">Open Account Today</a>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button type="button" class="mobile-hamburger-btn" id="mobileHamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>
    `;
  }

  // 2. INJECT SITE FOOTER
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-main">
          <div class="footer-grid">
            <!-- Col 1: Brand & Bio -->
            <div class="footer-col brand-col">
              <div class="brand-logo footer-logo">
                <img src="https://i.ibb.co/svKRSV69/WBCU-LOGO-03.png" alt="WB Credit Union Logo" style="height: 38px; width: auto; max-width: 200px; object-fit: contain;">
              </div>
              <p class="footer-bio" data-i18n="footer.tagline">
                We believe people come first. WB CREDIT UNION delivers premier personal, business, and high-yield financial solutions with state-of-the-art security and member-first care.
              </p>
              <div class="footer-routing-badge">
                <span>ROUTING NUMBER:</span>
                <strong>251480576</strong>
              </div>
            </div>

            <!-- Col 2: Products & Rates -->
            <div class="footer-col">
              <h4 class="footer-heading">Banking Products</h4>
              <ul class="footer-links">
                <li><a href="/#rates">High Yield Savings (3.75% APY*)</a></li>
                <li><a href="/#rates">18-Month Certificates (3.65% APY*)</a></li>
                <li><a href="/#rates">Low-Rate Credit Cards (4.00% APR*)</a></li>
                <li><a href="/#rates">Home Mortgages &amp; Loans</a></li>
                <li><a href="/#promo">$200 Checking Bonus</a></li>
              </ul>
            </div>

            <!-- Col 3: Member Services -->
            <div class="footer-col">
              <h4 class="footer-heading">Member Services</h4>
              <ul class="footer-links">
                <li><a href="/pages/login.html">Online Banking Login</a></li>
                <li><a href="/pages/register.html">Open an Account</a></li>
                <li><a href="/contact.html">Customer Support</a></li>
                <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                <li><a href="/terms-of-service.html">Terms of Service</a></li>
                <li><a href="/accessibility.html">Accessibility Statement</a></li>
                <li><a href="/pages/admin-login.html">Institutional Oversight</a></li>
              </ul>
            </div>

            <!-- Col 4: Branch Info & Support -->
            <div class="footer-col">
              <h4 class="footer-heading">24/7 Support &amp; Branch</h4>
              <div class="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <div>
                  <strong style="color:var(--primary-bright-blue, #2563eb); font-size:14px;"><a href="tel:18002265464" style="color:inherit; text-decoration:none;">1-800-BANKING</a></strong>
                  <span class="text-xs text-muted d-block">24/7 Toll-Free Support</span>
                </div>
              </div>
              <div class="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <div>
                  <strong style="font-size:13px;"><a href="mailto:support@wbcu.net" style="color:inherit; text-decoration:none;">support@wbcu.net</a></strong>
                  <span class="text-xs text-muted d-block">Official Inquiries &amp; Clearance</span>
                </div>
              </div>
              <div class="footer-contact-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <div>
                  <strong>Zurich Branch Hours:</strong>
                  <span class="text-xs text-muted d-block">Mon–Fri: 9AM–5PM | Sat: 9AM–1PM</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <div class="footer-legal">
              <p>&copy; ${new Date().getFullYear()} WB CREDIT UNION. <span data-i18n="footer.rights">All rights reserved. Equal Housing Lender. Insured &amp; regulated cooperative financial institution.</span></p>
              <p class="text-xs text-muted">*Annual Percentage Yield (APY) &amp; Annual Percentage Rate (APR) are accurate as of publication. Terms and conditions apply.</p>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // 3. ATTACH INTERACTIVE LISTENERS (STICKY SCROLL, MOBILE MENU, THEME TOGGLE, I18N)
  const headerEl = document.getElementById('mainHeader');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        headerEl.classList.add('scrolled');
      } else {
        headerEl.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  const hamburgerBtn = document.getElementById('mobileHamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('is-open');
      const expanded = navMenu.classList.contains('is-open');
      hamburgerBtn.setAttribute('aria-expanded', String(expanded));
    });

    // Close when clicking nav links on mobile
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Determine active menu item
    const path = window.location.pathname;
    const homeLink = document.getElementById('navLinkHome');
    const aboutLink = document.getElementById('navLinkAbout');
    const servicesLink = document.getElementById('navLinkServices');
    const contactLink = document.getElementById('navLinkContact');

    if (homeLink) homeLink.classList.remove('active');
    if (aboutLink) aboutLink.classList.remove('active');
    if (servicesLink) servicesLink.classList.remove('active');
    if (contactLink) contactLink.classList.remove('active');

    if (path.includes('about') && aboutLink) {
      aboutLink.classList.add('active');
    } else if (path.includes('service') && servicesLink) {
      servicesLink.classList.add('active');
    } else if (path.includes('contact') && contactLink) {
      contactLink.classList.add('active');
    } else if (homeLink) {
      homeLink.classList.add('active');
    }
  }

  // Header Theme Switcher
  const themeToggle = document.getElementById('headerThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', current);
      try {
        localStorage.setItem('wbcu_theme_preference', current);
      } catch (e) {}
    });
  }

  // Initialize Language Switcher Dropdown and DOM Translation
  initI18n();
}

// Auto-inject if DOM is ready or on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectHeaderAndFooter);
} else {
  injectHeaderAndFooter();
}
