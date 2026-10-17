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
lines.append("-- WB CREDIT FINANCE - TARGETED CPANEL MYSQL DATABASE UPDATE SCRIPT")
lines.append("-- ============================================================================")

lines.append("SET FOREIGN_KEY_CHECKS = 0;\n")

# Role mapping for ENUM compatibility
def map_role(role):
    r = str(role).lower()
    if "super" in r: return "super_admin"
    if "admin" in r: return "admin"
    if "auditor" in r: return "auditor"
    return "user"

# Status mapping for ENUM compatibility
def map_status(status):
    s = str(status).lower()
    if s in ["active", "inactive", "suspended", "frozen", "pending_approval"]: return s
    return "active"

# 1. Users Table
lines.append("-- 1. UPSERT USERS")
user_rows = []
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    username = str(u.get("username") or u.get("email", "").split("@")[0] or uid).replace("'", "''")
    email = str(u.get("email", "")).replace("'", "''")
    pwd = str(u.get("password") or "Password123!").replace("'", "''")
    role = map_role(u.get("role", "user") if not u.get("is_admin") else "super_admin")
    pin = str(u.get("pin") or u.get("transactionPin") or "2026").replace("'", "''")
    status = map_status(u.get("status") or u.get("account_status") or "active")
    kyc = "verified"
    user_rows.append(f"('{uid}', '{username}', '{email}', '{pwd}', '{role}', '{pin}', '{status}', '{kyc}')")

lines.append("INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `transaction_pin`, `status`, `kyc_status`)\nVALUES")
lines.append(",\n".join(user_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `transaction_pin` = VALUES(`transaction_pin`),
  `status` = VALUES(`status`),
  `kyc_status` = VALUES(`kyc_status`);
""")

# 2. Admins Table
lines.append("-- 2. UPSERT ADMINS")
admin_rows = []
for u in users:
    if u.get("is_admin") or "admin" in str(u.get("role", "")).lower():
        uid = str(u.get("id", "")).replace("'", "''")
        username = str(u.get("username") or u.get("email", "").split("@")[0] or uid).replace("'", "''")
        email = str(u.get("email", "")).replace("'", "''")
        pwd = str(u.get("password") or "12345").replace("'", "''")
        fullname = str(u.get("fullName") or "Chief Treasury Auditor").replace("'", "''")
        role = map_role(u.get("role", "admin"))
        admin_rows.append(f"('{uid}', '{username}', '{email}', '{pwd}', '{fullname}', '{role}', 'active')")

lines.append("INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `status`)\nVALUES")
lines.append(",\n".join(admin_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `full_name` = VALUES(`full_name`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);
""")

# 3. Profiles
lines.append("-- 3. UPSERT PROFILES")
prof_rows = []
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    prof_id = f"prof-{uid}"
    fname = str(u.get("firstName") or (u.get("fullName", "").split(" ")[0] if u.get("fullName") else "Member")).replace("'", "''")
    lname = str(u.get("lastName") or (" ".join(u.get("fullName", "").split(" ")[1:]) if u.get("fullName") else "User")).replace("'", "''")
    fullname = str(u.get("fullName") or f"{fname} {lname}".strip()).replace("'", "''")
    phone = str(u.get("phone") or "+41 44 915 0000").replace("'", "''")
    prof_rows.append(f"('{prof_id}', '{uid}', '{fname}', '{lname}', '{fullname}', '{phone}')")

lines.append("INSERT INTO `profiles` (`id`, `user_id`, `first_name`, `last_name`, `full_name`, `phone_number`)\nVALUES")
lines.append(",\n".join(prof_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `full_name` = VALUES(`full_name`),
  `phone_number` = VALUES(`phone_number`);
""")

# 4. Accounts
lines.append("-- 4. UPSERT ACCOUNTS")
acct_rows = []
seen_accts = set()
for u in users:
    uid = str(u.get("id", "")).replace("'", "''")
    accts = u.get("accounts")
    if isinstance(accts, list) and len(accts) > 0:
        for a in accts:
            aid = str(a.get("id") or f"acct-{uid}-{a.get('currency', 'USD')}").replace("'", "''")
            if aid in seen_accts: continue
            seen_accts.add(aid)
            anum = str(a.get("accountNumber") or a.get("account_number") or "9482-1049-55").replace("'", "''")
            atype = str(a.get("type") or "Checking")
            if atype not in ['Checking','Savings','Business','Offshore','Fixed Deposit','Money Market']: atype = 'Checking'
            aname = str(a.get("name") or f"{a.get('currency', 'USD')} Vault").replace("'", "''")
            curr = str(a.get("currency") or "USD").replace("'", "''")
            bal = float(a.get("balance") or 0)
            avail = float(a.get("available") or bal)
            ispri = 1 if a.get("isPrimary") else 0
            astatus = map_status(a.get("status") or "active")
            if astatus not in ['active','inactive','frozen','closed','dormant']: astatus = 'active'
            acct_rows.append(f"('{aid}', '{uid}', '{anum}', '{atype}', '{aname}', '{curr}', {bal:.2f}, {avail:.2f}, '251480576', 'WBCUUS33', {ispri}, '{astatus}')")

lines.append("INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `account_name`, `currency`, `balance`, `available_balance`, `routing_number`, `swift_bic`, `is_primary`, `status`)\nVALUES")
lines.append(",\n".join(acct_rows))
lines.append("""ON DUPLICATE KEY UPDATE
  `balance` = VALUES(`balance`),
  `available_balance` = VALUES(`available_balance`),
  `account_number` = VALUES(`account_number`);
""")

lines.append("\nSET FOREIGN_KEY_CHECKS = 1;\n")

final_sql = "\n".join(lines)
with open("cpanel_safe_update.sql", "w", encoding="utf-8") as f:
    f.write(final_sql)

print("Generated ENUM-compatible update SQL successfully!")
