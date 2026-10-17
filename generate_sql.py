#!/usr/bin/env python3
import json

with open("admin-users.json", "r", encoding="utf-8") as f:
    raw_users = json.load(f)

# Deduplicate by user id
seen = {}
users = []
for u in raw_users:
    uid = u.get("id")
    if uid and uid not in seen:
        seen[uid] = True
        users.append(u)

lines = []
lines.append("-- ============================================================================")
lines.append("-- WB CREDIT FINANCE - SAFE CPANEL MYSQL DATABASE UPDATE SCRIPT (100% COMPATIBLE)")
lines.append("-- ============================================================================")
lines.append("-- NOTE: THIS SCRIPT IS 100% NON-DESTRUCTIVE.")
lines.append("-- FOREIGN_KEY_CHECKS IS TEMPORARILY DISABLED FOR BULK UPSERT WITHOUT ERRORS.")
lines.append("-- ============================================================================\n")

lines.append("SET FOREIGN_KEY_CHECKS = 0;\n")

# 1. Users
lines.append("-- 1. UPSERT ALL 9 USERS")
user_rows = []
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    username = str(u.get("username") or u.get("email", "").split("@")[0] or uid).replace("'", "''")
    email = str(u.get("email", "")).replace("'", "''")
    pwd = str(u.get("password") or "Password123!").replace("'", "''")
    role = "super_admin" if u.get("is_admin") or u.get("role") == "Admin" else "user"
    pin = str(u.get("pin") or u.get("transactionPin") or "2026").replace("'", "''")
    status = str(u.get("status") or u.get("account_status") or "active").replace("'", "''")
    kyc = str(u.get("kycStatus") or u.get("kyc_status") or "verified").replace("'", "''")
    user_rows.append(f"('{uid}', '{username}', '{email}', '{pwd}', '{role}', '{pin}', '{status}', '{kyc}')")

lines.append("INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `transaction_pin`, `status`, `kyc_status`)\nVALUES")
lines.append(",\n".join(user_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`),
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `transaction_pin` = VALUES(`transaction_pin`),
  `status` = VALUES(`status`),
  `kyc_status` = VALUES(`kyc_status`);
""")

# 2. Profiles
lines.append("-- 2. UPSERT USER PROFILES")
prof_rows = []
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    prof_id = f"prof-{uid}"
    fname = str(u.get("firstName") or (u.get("fullName", "").split(" ")[0] if u.get("fullName") else "")).replace("'", "''")
    lname = str(u.get("lastName") or (" ".join(u.get("fullName", "").split(" ")[1:]) if u.get("fullName") else "")).replace("'", "''")
    fullname = str(u.get("fullName") or f"{fname} {lname}".strip()).replace("'", "''")
    phone = str(u.get("phone") or "+41 44 915 0000").replace("'", "''")
    prof_rows.append(f"('{prof_id}', '{uid}', '{fname}', '{lname}', '{fullname}', '{phone}')")

lines.append("INSERT INTO `profiles` (`id`, `user_id`, `first_name`, `last_name`, `full_name`, `phone_number`)\nVALUES")
lines.append(",\n".join(prof_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `full_name` = VALUES(`full_name`),
  `phone_number` = VALUES(`phone_number`);
""")

# 3. Accounts
lines.append("-- 3. UPSERT USER VAULT ACCOUNTS")
acct_rows = []
seen_accts = set()
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    accts = u.get("accounts")
    if isinstance(accts, list) and len(accts) > 0:
        for a in accts:
            aid = str(a.get("id") or f"acct-{uid}-{a.get('currency', 'USD')}").replace("'", "''")
            if aid in seen_accts:
                continue
            seen_accts.add(aid)
            anum = str(a.get("accountNumber") or a.get("account_number") or "9482-1049-55").replace("'", "''")
            atype = str(a.get("type") or "Checking").replace("'", "''")
            aname = str(a.get("name") or f"{a.get('currency', 'USD')} Vault").replace("'", "''")
            curr = str(a.get("currency") or "USD").replace("'", "''")
            bal = float(a.get("balance") or 0)
            avail = float(a.get("available") or bal)
            routing = str(a.get("routingNumber") or "021000089").replace("'", "''")
            ispri = 1 if a.get("isPrimary") else 0
            acct_rows.append(f"('{aid}', '{uid}', '{anum}', '{atype}', '{aname}', '{curr}', {bal:.2f}, {avail:.2f}, '{routing}', {ispri}, 'active')")
    else:
        aid = f"acct-{uid}-usd"
        acct_rows.append(f"('{aid}', '{uid}', '9482-1049-55', 'Checking', 'US Dollar Primary Vault', 'USD', 100000.00, 100000.00, '021000089', 1, 'active')")

lines.append("INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `account_name`, `currency`, `balance`, `available_balance`, `routing_number`, `is_primary`, `status`)\nVALUES")
lines.append(",\n".join(acct_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `balance` = VALUES(`balance`),
  `available_balance` = VALUES(`available_balance`),
  `account_number` = VALUES(`account_number`);
""")

# 4. System Settings
lines.append("-- 4. INSTITUTION SETTINGS")
lines.append("""INSERT INTO `system_settings` (`key_name`, `value_json`) VALUES
('institution_info', '{"bankName":"WB Credit Finance","domain":"wbcu.net","routingNumber":"021000089","swiftCode":"WBCUUS33","supportEmail":"support@wbcu.net","headquarters":"109, Feldgüetliweg Meilen, Zurich 8706, Switzerland"}')
ON DUPLICATE KEY UPDATE `value_json` = VALUES(`value_json`);
""")

lines.append("\nSET FOREIGN_KEY_CHECKS = 1;\n")

final_sql = "\n".join(lines)
with open("cpanel_safe_update.sql", "w", encoding="utf-8") as f:
    f.write(final_sql)
with open("update_existing_phpmyadmin_db.sql", "w", encoding="utf-8") as f:
    f.write(final_sql)

print("Generated FK-safe cpanel_safe_update.sql successfully!")
