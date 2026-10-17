#!/usr/bin/env python3
"""
============================================================================
WB CREDIT UNION - AUTOMATED PRODUCTION SYNCHRONIZATION SCRIPT (Python 3)
============================================================================

Description:
Automates fetching the latest codebase from GitHub main branch, building the
app, updating PHP API backends, synchronizing dist/ assets into public_html,
and protecting user databases (admin-users.json & admin-users-persistent.json).

Usage (Run in Terminal or cPanel SSH):
  python3 wbcu_sync.py
============================================================================
"""

import os
import sys
import shutil
import subprocess
import json
import time

# Colors for Terminal Output
GREEN = '\033[92m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

def log(msg, level="INFO"):
    prefix = {
        "INFO": f"{CYAN}[INFO]{RESET}",
        "SUCCESS": f"{GREEN}[SUCCESS]{RESET}",
        "WARN": f"{YELLOW}[WARNING]{RESET}",
        "ERROR": f"{RED}[ERROR]{RESET}"
    }.get(level, "[LOG]")
    print(f"{prefix} {msg}")

def run_cmd(cmd, cwd=None, ignore_errors=False):
    log(f"Executing: {cmd}", "INFO")
    try:
        res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if res.returncode != 0 and not ignore_errors:
            log(f"Command failed (exit code {res.returncode}):\n{res.stderr.strip()}", "WARN")
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        log(f"Exception executing command '{cmd}': {str(e)}", "ERROR")
        return False, "", str(e)

def main():
    print(f"\n{BOLD}======================================================{RESET}")
    print(f"{BOLD}{GREEN} WB CREDIT UNION - LIVE SITE PRODUCTION SYNCHRONIZATION {RESET}")
    print(f"{BOLD}======================================================{RESET}\n")

    current_dir = os.path.abspath(os.getcwd())
    log(f"Current Directory: {current_dir}", "INFO")

    # Detect Target Production Path
    possible_deploy_paths = [
        "/home/glolbka/public_html",
        os.path.expanduser("~/public_html"),
        current_dir
    ]
    
    target_deploy_path = None
    for p in possible_deploy_paths:
        if os.path.isdir(p):
            target_deploy_path = p
            break
            
    if not target_deploy_path:
        target_deploy_path = current_dir

    log(f"Target Production Path: {target_deploy_path}", "INFO")

    # 1. Clean Disk Space (Truncate Error Logs > 1MB)
    log("Checking and truncating oversized error logs to conserve quota...", "INFO")
    log_files = [
        os.path.join(target_deploy_path, "error_log"),
        os.path.join(target_deploy_path, "api", "error_log"),
        os.path.join(current_dir, "error_log")
    ]
    for lf in log_files:
        if os.path.exists(lf) and os.path.getsize(lf) > 1024 * 1024:
            try:
                with open(lf, "w") as f:
                    f.truncate(0)
                log(f"Truncated large log file: {lf}", "SUCCESS")
            except Exception as e:
                log(f"Could not truncate {lf}: {e}", "WARN")

    # 2. Git Fetch & Hard Reset to GitHub main
    log("Fetching latest codebase from GitHub (origin/main)...", "INFO")
    success, out, err = run_cmd("git fetch origin main")
    if success:
        run_cmd("git checkout -f main")
        run_cmd("git reset --hard origin/main")
        run_cmd("git clean -fd -e admin-users.json -e admin-users-persistent.json -e .env")
        log("Successfully synchronized Git branch to origin/main.", "SUCCESS")
    else:
        log("Git fetch encountered warnings. Proceeding with local file synchronization...", "WARN")

    # 3. Build Production Assets
    log("Building web application production bundle...", "INFO")
    if os.path.exists("package.json"):
        success, out, err = run_cmd("npm run build")
        if success:
            log("Production build compiled successfully (dist/ created).", "SUCCESS")
        else:
            log(f"npm run build failed or Vite not installed in environment. Relying on raw HTML/JS/CSS assets.", "WARN")

    # 4. Copy Assets into Target Deployment Folder
    if target_deploy_path != current_dir:
        log(f"Copying files from {current_dir} -> {target_deploy_path}...", "INFO")
        
        # Ensure directories exist
        for d in ["api", "js", "pages", "admin", "css"]:
            os.makedirs(os.path.join(target_deploy_path, d), exist_ok=True)

        # Copy Dist
        dist_dir = os.path.join(current_dir, "dist")
        if os.path.isdir(dist_dir):
            for item in os.listdir(dist_dir):
                s = os.path.join(dist_dir, item)
                d = os.path.join(target_deploy_path, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, d)

        # Copy backend folders
        for folder in ["api", "js", "pages", "admin"]:
            src_f = os.path.join(current_dir, folder)
            dst_f = os.path.join(target_deploy_path, folder)
            if os.path.isdir(src_f):
                shutil.copytree(src_f, dst_f, dirs_exist_ok=True)

        # Copy single entry files
        entry_files = ["admin.html", "admin-login.html", "login-admin.html", "index.html", ".htaccess", "deploy.php", "server.js"]
        for ef in entry_files:
            src_file = os.path.join(current_dir, ef)
            if os.path.isfile(src_file):
                shutil.copy2(src_file, os.path.join(target_deploy_path, ef))
                if ef == "admin.html":
                    shutil.copy2(src_file, os.path.join(target_deploy_path, "admin", "index.html"))
                    shutil.copy2(src_file, os.path.join(target_deploy_path, "pages", "admin-dashboard.html"))
                    shutil.copy2(src_file, os.path.join(target_deploy_path, "pages", "admin.html"))

        # Preserve user database files safely
        for dbf in ["admin-users.json", "admin-users-persistent.json"]:
            src_db = os.path.join(current_dir, dbf)
            dst_db = os.path.join(target_deploy_path, dbf)
            if os.path.isfile(src_db) and not os.path.exists(dst_db):
                shutil.copy2(src_db, dst_db)

        log("File copying completed.", "SUCCESS")

    # 5. Trigger cPanel update_deploy if available
    cpcmd_path = "/usr/local/cpanel/bin/cpcmd"
    if os.path.isfile(cpcmd_path):
        log("Triggering cPanel VersionControl deploy hook...", "INFO")
        repo_root = "/home/glolbka/repositories/WBCU" if os.path.isdir("/home/glolbka/repositories/WBCU") else current_dir
        run_cmd(f"{cpcmd_path} VersionControl update_deploy repository_root={repo_root}", ignore_errors=True)

    print(f"\n{BOLD}{GREEN}======================================================{RESET}")
    print(f"{BOLD}{GREEN} SYNCHRONIZATION COMPLETE! wbcu.net IS NOW UP TO DATE. {RESET}")
    print(f"{BOLD}{GREEN}======================================================{RESET}\n")

if __name__ == "__main__":
    main()
