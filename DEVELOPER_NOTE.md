# DEVELOPER'S HANDOVER NOTE & SYSTEM ARCHITECTURE
**Project:** WB Credit Finance (Institutional Banking & Treasury Console)  
**Production Root:** `/home/glolbka/WBCU`  
**Git Repository:** `/home/glolbka/repositories/WBCU`  
**Database:** MySQL / MariaDB (`glolbka_wbcu_db`)  
**Stack:** PHP 8.1+ / Apache / LiteSpeed / Native ES6 JavaScript Modules (No Bundler)

---

## 1. Executive Summary & Change Log

This document covers all engineering fixes, security hardening, and architectural enhancements applied across the frontend, backend APIs, and database layers.

### Summary of Latest Updates:
1. **Official Logo in Email Transmissions:** Embedded the high-resolution logo (`https://i.ibb.co/svKRSV69/WBCU-LOGO-03.png`) in the headers of `/api/send-email.php` and `/api/test-smtp.php`.
2. **User Profile Drawer Balance Fix:** Resolved an unhandled `TypeError` on `user.activityLog.unshift` in `js/admin-users.js`, ensuring balance updates in the admin drawer persist to MySQL and refresh the table view immediately.
3. **Credit/Debit Modal & Auto-Email Dispatch:** Linked the Manual Ledger Adjustment modal (`creditDebitModal`) in `js/admin.js` to MySQL (`accounts` table) and configured automated HTML transaction receipt dispatches to recipient inboxes.
4. **Member Multi-Mode Authentication:**
   - **Method 1 (Email & Passcode):** Verified against MySQL `users` and `admins`.
   - **Method 2 (Account & PIN):** Connected `/api/login.php` to query `accounts.account_number` and authenticate via `users.transaction_pin`.
   - **Method 3 (Biometrics):** Strictly rejects unenrolled/unregistered visitors.
5. **ATM Card Issuance PIN Enforcement:** Enforced mandatory 4-digit transaction security PIN verification in `js/app.js` before card issuance.
6. **Mobile-Responsive Admin Navigation:** Installed sticky mobile topbar controls (**⚙️ Settings**, **🚪 Logout**) and a slide-out hamburger navigation drawer on screens <= 900px.
7. **Strict `/admin` Session Gatekeeper:** Updated `.htaccess` and injected an immediate `<head>` guard requiring active `sessionStorage`, preventing unauthorized direct access.
8. **Security Hardening:** Restricted public web access in `.htaccess` for `.env`, `.git`, `admin-users.json`, and all diagnostic utilities (403 Forbidden).

---

## 2. API Endpoints & Responsibilities

| Endpoint | Method | Function |
| :--- | :--- | :--- |
| `/api/login.php` | `POST` | Authenticates members via Email/Password or 10-digit Account Number + 4-digit PIN. |
| `/api/admin-login.php` | `POST` | Authenticates treasury officers against MySQL `admins` table. |
| `/api/admin-users.php` | `GET`, `POST` | `GET`: Returns combined admins and users with profile photos and vault balances.<br>`POST`: Updates `accounts` (balances/status), `profiles` (photos/names), and `admins`. |
| `/api/send-email.php` | `POST` | Dispatches branded HTML transaction notices via custom SMTP or cPanel local Exim MTA. |
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
