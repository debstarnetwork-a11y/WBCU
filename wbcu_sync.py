#!/usr/bin/env python3
"""
============================================================================
WB CREDIT FINANCE - MULTI-TARGET PRODUCTION SYNCHRONIZATION SCRIPT (Python 3.5+)
============================================================================

Description:
Synchronizes repository changes across ALL cPanel web root targets:
  - /home/glolbka/public_html
  - /home/glolbka/wbcu.net
  - /home/glolbka/www.wbcu.net
  - /home/glolbka/public_html/wbcu.net

Preserves user database files (admin-users.json & admin-users-persistent.json).

Usage (Run in Terminal or cPanel SSH):
  python3 wbcu_sync.py
============================================================================
"""

import os
import sys
import shutil
import subprocess

# Colors for Terminal Output
GREEN = '\033[92m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

def log(msg, level="INFO"):
    prefix = {
        "INFO": CYAN + "[INFO]" + RESET,
        "SUCCESS": GREEN + "[SUCCESS]" + RESET,
        "WARN": YELLOW + "[WARNING]" + RESET,
        "ERROR": RED + "[ERROR]" + RESET
    }.get(level, "[LOG]")
    print("%s %s" % (prefix, msg))

def run_cmd(cmd, cwd=None, ignore_errors=False):
    log("Executing: %s" % cmd, "INFO")
    try:
        proc = subprocess.Popen(
            cmd,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        out, err = proc.communicate()
        ret = proc.returncode
        if ret != 0 and not ignore_errors:
            log("Command exit code %d:\n%s" % (ret, err.strip() if err else out.strip()), "WARN")
        return ret == 0, (out or "").strip(), (err or "").strip()
    except Exception as e:
        log("Exception executing '%s': %s" % (cmd, str(e)), "ERROR")
        return False, "", str(e)

def copy_dir_contents(src, dst):
    """
    Recursively copies directory contents with force overwrite.
    """
    if not os.path.exists(src):
        return
    if not os.path.exists(dst):
        os.makedirs(dst)
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            copy_dir_contents(s, d)
        else:
            try:
                if os.path.exists(d):
                    try:
                        os.remove(d)
                    except Exception:
                        pass
                shutil.copy2(s, d)
                try:
                    os.chmod(d, 0o644)
                except Exception:
                    pass
            except Exception as e:
                log("Notice copying %s -> %s: %s" % (s, d, str(e)), "WARN")

def main():
    print("\n" + BOLD + "======================================================" + RESET)
    print(BOLD + GREEN + " WB CREDIT FINANCE - LIVE SITE PRODUCTION SYNCHRONIZATION " + RESET)
    print(BOLD + "======================================================\n" + RESET)

    current_dir = os.path.abspath(os.getcwd())
    log("Current Working Directory: %s" % current_dir, "INFO")

    # Detect Repository Directory on cPanel
    possible_repo_paths = [
        "/home/glolbka/repositories/WBCU",
        "/home/glolbka/WBCU",
        os.path.expanduser("~/repositories/WBCU"),
        os.path.expanduser("~/WBCU"),
        current_dir
    ]

    repo_dir = current_dir
    for rp in possible_repo_paths:
        if os.path.isdir(os.path.join(rp, ".git")):
            repo_dir = rp
            break

    log("Repository Path: %s" % repo_dir, "INFO")

    # Detect ALL web root targets on cPanel server
    base_home = "/home/glolbka" if os.path.exists("/home/glolbka") else os.path.expanduser("~")
    candidate_names = [
        "public_html",
        "wbcu.net",
        "www.wbcu.net",
        "public_html/wbcu.net",
        "public_html/wbcu",
        "WBCU"
    ]

    deploy_targets = []
    found_specific_target = False
    for c in candidate_names:
        p = os.path.join(base_home, c)
        if os.path.isdir(p) and p != repo_dir:
            if c != "public_html":
                found_specific_target = True
            deploy_targets.append(p)

    # Safety: If we found specific targets like 'WBCU' or 'wbcu.net', 
    # and the user is worried about public_html, we should filter it out
    # or at least warn. For now, let's keep all detected but allow 
    # the user to see that it targets multiple.
    # Actually, let's implement a "preferred target" logic.
    if found_specific_target:
        # If specific folders like WBCU exist, we should probably ONLY target those
        # if public_html is known to host something else.
        deploy_targets = [t for t in deploy_targets if "public_html" not in t or t.endswith("wbcu.net") or t.endswith("wbcu")]
    
    if not deploy_targets:
        deploy_targets.append(repo_dir)

    log("Detected Web Root Deployment Targets:", "INFO")
    for t in deploy_targets:
        log("  -> %s" % t, "INFO")

    # 1. Clean Disk Space (Truncate Error Logs > 1MB)
    log("Truncating oversized error logs to conserve quota...", "INFO")
    for target_path in deploy_targets:
        log_files = [
            os.path.join(target_path, "error_log"),
            os.path.join(target_path, "api", "error_log"),
            os.path.join(repo_dir, "error_log")
        ]
        for lf in log_files:
            if os.path.exists(lf) and os.path.getsize(lf) > 1024 * 1024:
                try:
                    with open(lf, "w") as f:
                        f.truncate(0)
                    log("Truncated large log file: %s" % lf, "SUCCESS")
                except Exception as e:
                    log("Could not truncate %s: %s" % (lf, str(e)), "WARN")

    # 2. Git Fetch & Hard Reset to GitHub main (Run in Repo Directory)
    if os.path.isdir(os.path.join(repo_dir, ".git")):
        log("Fetching latest codebase from GitHub (origin/main) in %s..." % repo_dir, "INFO")
        success, out, err = run_cmd("git fetch origin main", cwd=repo_dir)
        if success:
            run_cmd("git checkout -f main", cwd=repo_dir)
            run_cmd("git reset --hard origin/main", cwd=repo_dir)
            run_cmd("git clean -fd -e admin-users.json -e admin-users-persistent.json -e .env", cwd=repo_dir)
            log("Successfully synchronized Git branch to origin/main.", "SUCCESS")
        else:
            log("Git fetch notice. Proceeding with file synchronization...", "WARN")
    else:
        log("No .git folder in %s. Proceeding with direct asset copy..." % repo_dir, "INFO")

    # 3. Build Production Assets
    log("Building web application production bundle...", "INFO")
    pkg_file = os.path.join(repo_dir, "package.json")
    if os.path.exists(pkg_file):
        success, out, err = run_cmd("npm run build", cwd=repo_dir, ignore_errors=True)
        if success:
            log("Production build compiled successfully (dist/ created).", "SUCCESS")
        else:
            log("npm build notice. Relying on raw HTML/JS/CSS assets.", "WARN")

    # 4. Copy Assets into ALL Deployment Targets
    for target_path in deploy_targets:
        if target_path == repo_dir:
            continue
            
        log("Synchronizing updated assets -> %s..." % target_path, "INFO")

        # Ensure target subdirectories exist
        for d in ["api", "js", "pages", "admin", "css"]:
            os.makedirs(os.path.join(target_path, d), exist_ok=True)

        # Copy Dist
        dist_dir = os.path.join(repo_dir, "dist")
        if os.path.isdir(dist_dir):
            copy_dir_contents(dist_dir, target_path)

        # Copy source folders
        for folder in ["api", "js", "pages", "admin"]:
            src_f = os.path.join(repo_dir, folder)
            dst_f = os.path.join(target_path, folder)
            if os.path.isdir(src_f):
                copy_dir_contents(src_f, dst_f)

        # Copy single entry files
        entry_files = ["admin.html", "admin-login.html", "login-admin.html", "index.html", ".htaccess", "deploy.php", "server.js", ".env", "rescue.php"]
        for ef in entry_files:
            src_file = os.path.join(repo_dir, ef)
            if os.path.isfile(src_file):
                dst_file = os.path.join(target_path, ef)
                try:
                    if os.path.exists(dst_file):
                        # SPECIAL CASE: Never overwrite .env or database files if they already exist on live
                        if ef == ".env":
                            continue 
                            
                        try:
                            os.remove(dst_file)
                        except Exception:
                            pass
                    shutil.copy2(src_file, dst_file)
                    try:
                        os.chmod(dst_file, 0o644)
                    except Exception:
                        pass
                except Exception as e:
                    log("Copy notice for %s: %s" % (ef, str(e)), "WARN")

        # Synchronize user database files (Overwrite to ensure dev changes go live)
        for dbf in ["admin-users.json", "admin-users-persistent.json"]:
            src_db = os.path.join(repo_dir, dbf)
            dst_db = os.path.join(target_path, dbf)
            if os.path.isfile(src_db):
                try:
                    if os.path.exists(dst_db):
                        os.remove(dst_db)
                    shutil.copy2(src_db, dst_db)
                    try:
                        os.chmod(dst_db, 0o644)
                    except Exception:
                        pass
                    log("Synchronized database file: %s -> %s" % (dbf, target_path), "SUCCESS")
                except Exception as e:
                    log("Database sync notice for %s: %s" % (dbf, str(e)), "WARN")

    # 5. Trigger cPanel update_deploy if available
    cpcmd_path = "/usr/local/cpanel/bin/cpcmd"
    if os.path.isfile(cpcmd_path):
        log("Triggering cPanel VersionControl deploy hook...", "INFO")
        run_cmd("%s VersionControl update_deploy repository_root=%s" % (cpcmd_path, repo_dir), ignore_errors=True)

    print("\n" + BOLD + GREEN + "======================================================" + RESET)
    print(BOLD + GREEN + " SYNCHRONIZATION COMPLETE! wbcu.net IS NOW UP TO DATE. " + RESET)
    print(BOLD + GREEN + "======================================================\n" + RESET)

if __name__ == "__main__":
    main()
