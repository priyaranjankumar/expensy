# Proxmox LXC Deployment Guide for Expensy

Deploy Expensy in a lightweight, resource-optimized LXC container on Proxmox VE using scripts structured like the **Proxmox VE Helper-Scripts (Community Edition)**.

---

## Quick Start

To deploy a new Expensy container using the default settings, run the following command directly in your Proxmox VE host terminal:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/priyaranjankumar/expensy/main/proxmox/ct/expensy.sh)"
```

This command will:
1. Load the interactive setup wizard.
2. Automatically select **Ubuntu 24.04** as the container OS.
3. Provision the container with default resources (**1 vCPU, 256MB RAM, 4GB Storage**).
4. Run the installation script inside the container to install Node.js, Python 3, clone the repository, build the frontend, and start the systemd service.
5. Enable passwordless console root autologin and set up the pretty welcome login banner.

---

## Customization

To customize variables (such as Container ID, CPU Cores, RAM, or Disk Size) directly from the command line, export them before running the script:

| Variable | Default | Description |
|----------|---------|-------------|
| `CTID` | Auto | Next available Container ID |
| `PCT_CPU_CORES` | 1 | CPU cores |
| `PCT_MEMORY` | 256 | RAM in MB |
| `PCT_SWAP` | 512 | Swap in MB |
| `PCT_DISK_SIZE` | 4G | Disk size (e.g. 4G, 10G) |

### Example Custom Installation:
```bash
CTID=120 PCT_CPU_CORES=2 PCT_MEMORY=512 PCT_DISK_SIZE=6G bash -c "$(curl -fsSL https://raw.githubusercontent.com/priyaranjankumar/expensy/main/proxmox/ct/expensy.sh)"
```

---

## Managing the Service

The application runs as a systemd service under the dedicated unprivileged system user `expensy`.

Inside the LXC container, you can manage the service using `systemctl`:

```bash
# Check service status
systemctl status expensy

# View service logs in real time
journalctl -u expensy -f

# Restart the application
systemctl restart expensy

# Stop the application
systemctl stop expensy

# Start the application
systemctl start expensy
```

From the **Proxmox Host**, you can run these commands remotely via `pct exec`:

```bash
# Check status remotely
pct exec <CTID> -- systemctl status expensy

# View last 50 log lines remotely
pct exec <CTID> -- journalctl -u expensy -n 50 --no-pager
```

---

## Console Autologin & Metadata Banner

The container is configured for console root auto-login. When opening the container console (via Proxmox Web UI or `pct enter`), you will be automatically logged in as `root` and shown a welcome banner containing:
- Application name (`Expensy LXC Container`)
- OS distribution & version
- Container Hostname
- Local IP address

---

## Updating Expensy

You can update the application inside the LXC container to the latest version by running the update helper:

### From the Proxmox Host:
```bash
# Runs the host script with the update parameter inside the container
pct exec <CTID> -- bash -c "$(curl -fsSL https://raw.githubusercontent.com/priyaranjankumar/expensy/main/proxmox/ct/expensy.sh) -u"
```

This will automatically stop the service, fetch the latest code from the `main` branch, update Python packages, rebuild the React frontend, re-copy the assets, fix permissions, and restart the service.

---

## Backup & Restore

Since Expensy uses SQLite (`/opt/expensy/backend/data/expenses.db`), backing up the LXC container backs up the entire application database and files.

### Backup (vzdump)
From the Proxmox Host:
```bash
vzdump <CTID> --compress zstd --storage local --remove 0
```

### Restore (pct restore)
From the Proxmox Host:
```bash
pct restore <new-CTID> /var/lib/vz/dump/vzdump-lxc-<CTID>-....tar.zst --storage local-lvm
```
