# DEVELOPER'S HANDOVER NOTE & SYSTEM ARCHITECTURE (V3 - FINAL)
**Project:** WB Credit Finance (Institutional Banking & Treasury Console)  
**Production Root:** `/home/glolbka/WBCU`  
**Git Repository:** `/home/glolbka/repositories/WBCU`  
**Database:** MySQL / MariaDB (`glolbka_wbcu_db`)  
**Stack:** PHP 8.1+ / Apache / LiteSpeed / Native ES6 JavaScript Modules (No Bundler)

---

## 1. Executive Summary & Complete Changelog

This document records all engineering resolutions, security hardening, and architectural enhancements applied across the frontend, backend APIs, email dispatchers, and MySQL database layers.

### Latest Engineering Fixes:
1. **RFC-Compliant Base64 MIME Email Engine:**
   * *Problem:* Transaction emails in Gmail rendered as raw plain-text code (`<!DOCTYPE html>...`) and were flagged as spam due to unencoded financial symbols (`$100,000.00`) and malformed Unix line breaks (`\n`).
   * *Fix:* Re-architected `/api/send-email.php` with Base64 MIME encapsulation (`Content-Transfer-Encoding: base64`) and RFC-2047 subject/from header encoding (`=?UTF-8?B?...?=`). Gmail, Yahoo, and Outlook now render the email as an HTML card with zero raw code.
2. **Email Header Logo Contrast & Dimension Fix:**
   * *Problem:* The bank logo appeared invisible against dark backgrounds and collapsed in mobile email clients.
   * *Fix:* Applied the high-contrast Royal Blue gradient header (`linear-gradient(135deg, #1e40af, #3b82f6)`) with explicit HTML attributes (`width="180" height="44" border="0"`) across all outgoing email templates.
3. **Syntax Error Resolution in `admin-users.js`:**
   * *Problem:* An orphaned duplicate closing bracket (`};`) at line 2753 caused an unhandled `SyntaxError: Unexpected token '}'`. This caused the browser to abort the entire module graph, killing the login button on `admin-login.html` and rendering `admin.html` completely empty.
   * *Fix:* Removed the duplicate bracket, restored bracket balance to 0, and verified module parsing.
4. **Multi-Account Balance Discrepancy Resolution:**
   * *Problem:* Users with multiple vaults (e.g., EUR Offshore at $0 and USD Checking at $100,000) displayed conflicting figures between the user table and management drawer because `/api/admin-users.php` queried accounts without sorting.
   * *Fix:* Added `ORDER BY is_primary DESC, balance DESC, id ASC` to `/api/admin-users.php`. The primary funded account now loads first across both the table roster and the drawer form.
5. **Drawer Profile Save & Balance Update Fix:**
   * *Problem:* Clicking **⚡ EXECUTE & SAVE PROFILE CHANGES** threw a `TypeError` on `user.activityLog.unshift` because `activityLog` was undefined on MySQL records.
   * *Fix:* Guarded `user.activityLog` with array initialization, persisted the updated balance to MySQL via `updateUser(user)`, and refreshed `renderUsersTable()` immediately.
6. **Credit/Debit Modal & Auto-Email Dispatch:**
   * *Problem:* The manual adjustment modal (`creditDebitModal`) only altered an in-memory counter (`defaultStats`).
   * *Fix:* Connected `adminLedgerForm` in `js/admin.js` to MySQL (`accounts` table), updated balances in memory, refreshed the table, and automatically dispatched an HTML transaction receipt to the member's email.
7. **Member Multi-Mode Authentication:**
   * **Method 1 (Email & Passcode):** Authenticates against MySQL `users` and `admins`.
   * **Method 2 (Account & PIN):** Connected `/api/login.php` to query `accounts.account_number` and verify `users.transaction_pin`.
   * **Method 3 (Biometrics):** Strictly rejects unenrolled or unregistered visitors.
8. **ATM Card Request PIN Enforcement:**
   * *Problem:* `js/app.js` contained an automated `1234` bypass that issued cards without knowing the user's PIN.
   * *Fix:* Mandated that the member enter their registered 4-digit transaction security PIN, validating against MySQL before issuing any card.
9. **Mobile-Responsive Admin Controls:**
   * *Problem:* On screens <= 900px, the admin sidebar was hidden with no accessible way to log out or reach system settings.
   * *Fix:* Added a sticky mobile topbar with direct **⚙️ Settings** and **🚪 Logout** buttons, and wired the hamburger toggle button (`toggleSidebarBtn`) to slide open the navigation drawer.
10. **Strict `/admin` Session Gatekeeper:**
    * *Problem:* `.htaccess` routed `^admin$` to an unprotected legacy mockup file.
    * *Fix:* Routed `^admin$` to `pages/admin.html` and enforced a strict `<head>` session guard requiring active `sessionStorage` clearance.

---

## 2. API Endpoints & Responsibilities

| Endpoint | Method | Function |
| :--- | :--- | :--- |
| `/api/login.php` | `POST` | Authenticates members via Email/Password or 10-digit Account Number + 4-digit PIN. Returns full user vault object. |
| `/api/admin-login.php` | `POST` | Authenticates treasury officers against MySQL `admins` table. Prepares session for Step 2 Biometric clearance. |
| `/api/admin-users.php` | `GET`, `POST` | `GET`: Returns combined admins and users with profile photos and vault balances.<br>`POST`: Updates `accounts` (balances/status), `profiles` (photos/names), and `admins`. |
| `/api/send-email.php` | `POST` | Dispatches branded HTML transaction notices and recovery codes via Base64 MIME encapsulation. |
| `/api/test-smtp.php` | `POST` | Live TLS/SSL socket connectivity tester with multi-line SMTP buffer reading. |

---

## 3. Database Schema Overview (`glolbka_wbcu_db`)

* `admins`: Institutional officers (`admin`, `mizbrymo`). Contains `username`, `email`, `password_hash`, `full_name`, `role`.
* `users`: Banking members. Contains `id`, `username`, `email`, `password_hash`, `transaction_pin`, `status`, `kyc_status`.
* `profiles`: Linked to `users.id` via `user_id`. Contains `first_name`, `last_name`, `full_name`, `phone_number`, `profile_photo_url`, `passport_photo_url`, `avatar_color`.
* `accounts`: Vault records linked to `users.id` via `user_id`. Contains `account_number`, `account_type`, `currency`, `balance`, `available_balance`, `routing_number`, `status`.
* `cards`: Provisioned physical and virtual debit/credit cards linked to `users.id`.
* `wire_transfer_codes`: Clearance codes (`cot_code`, `imf_code`, `tax_code`) for cross-border wires.

---

## 4. Development & Deployment Guidelines

1. **Native ES6 Modules:** Never use bare Node imports like `import { x } from 'package'`. Always use relative paths (`./file.js`) or CDN URLs (`https://esm.sh/package@version`).
2. **Two-Way File Mirroring:** Always mirror server edits across both `/home/glolbka/WBCU` and `/home/glolbka/repositories/WBCU`.
3. **Cache Invalidation:** Always execute `touch /home/glolbka/WBCU/.htaccess` after updating assets to flush LiteSpeed web server cache.
