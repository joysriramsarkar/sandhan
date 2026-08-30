#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sandhan}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "[INFO] Starting Sandhan Backup at $TIMESTAMP..."

# 1. Backup Sync JSON Vault Store
if [ -d "data" ]; then
    tar -czf "$BACKUP_DIR/sandhan_data_$TIMESTAMP.tar.gz" data/
    echo "[INFO] Vault store backed up to $BACKUP_DIR/sandhan_data_$TIMESTAMP.tar.gz"
fi

# 2. Rotate backups older than 14 days
find "$BACKUP_DIR" -type f -name "sandhan_data_*.tar.gz" -mtime +14 -delete
echo "[INFO] Backup rotation complete. Healthy."
