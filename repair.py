#!/usr/bin/env python3
import os
import json

# 1. Configuration
repo_dir = "/home/glolbka/repositories/WBCU"
if not os.path.isdir(repo_dir):
    repo_dir = os.getcwd()

print(f"Repairing environment in: {repo_dir}")

# 2. Ensure admin-users.json exists in repo
json_path = os.path.join(repo_dir, "admin-users.json")
if not os.path.exists(json_path) or os.path.getsize(json_path) < 100:
    print("Re-generating admin-users.json baseline...")
    users = [
        {
            "id": "usr-admin-01",
            "username": "admin",
            "email": "admin@wbcu.net",
            "password": "12345",
            "fullName": "Chief Treasury Auditor",
            "role": "super_admin",
            "is_admin": True,
            "status": "active",
            "accounts": [{"accountNumber": "09331164002", "balance": 500000.0, "currency": "USD", "isPrimary": True}]
        },
        {
            "id": "wb-usr-y4rfbph",
            "username": "debeluemmanuel",
            "email": "debeluemmanuel@gmail.com",
            "password": "yeshuah.com",
            "fullName": "DEBELU EMMANUEL",
            "role": "user",
            "is_admin": False,
            "status": "active",
            "accounts": [{"accountNumber": "9482-1049-55", "balance": 100000.0, "currency": "USD", "isPrimary": True}]
        }
    ]
    with open(json_path, "w") as f:
        json.dump(users, f, indent=2)
    print("Success: admin-users.json restored.")

# 3. Create .env template if missing
env_path = os.path.join(repo_dir, ".env")
if not os.path.exists(env_path):
    print("Creating .env template...")
    with open(env_path, "w") as f:
        f.write("# WB Credit Finance Environment\n")
        f.write("DB_HOST=localhost\n")
        f.write("DB_NAME=glolbka_wbcu_db\n")
        f.write("DB_USER=glolbka_wbcu_user\n")
        f.write("DB_PASS=PLEASE_EDIT_THIS_IN_CPANEL_FILE_MANAGER\n")
    print("Success: .env created. IMPORTANT: Edit this file in cPanel and set your DB_PASS.")

# 4. Trigger Sync
print("Triggering full synchronization...")
os.system("python3 wbcu_sync.py")

print("\nREPAIR COMPLETE.")
print("1. Go to cPanel File Manager.")
print("2. Open /home/glolbka/public_html/.env")
print("3. Enter your database password in DB_PASS.")
print("4. Try logging in again.")
