#!/usr/bin/env bash

# Copyright (c) 2021-2026 community-scripts ORG
# Author: priyaranjankumar
# License: MIT | https://github.com/community-scripts/ProxmoxVE/raw/main/LICENSE
# Source: https://github.com/priyaranjankumar/expensy

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

APP="Expensy"

msg_info "Installing dependencies"
$STD apt-get install -y \
  git \
  curl \
  build-essential \
  libssl-dev \
  libffi-dev \
  sqlite3 \
  python3 \
  python3-pip \
  python3-venv \
  python3-dev
msg_ok "Installed dependencies"

# Setup Node.js v22
NODE_VERSION="22" setup_nodejs

# Clone Expensy repository
msg_info "Cloning Expensy repository"
rm -rf /opt/expensy
git clone https://github.com/priyaranjankumar/expensy.git /opt/expensy
msg_ok "Cloned Expensy repository"

# Setup Python backend virtual environment
msg_info "Setting up Python virtual environment"
python3 -m venv /opt/expensy/venv
$STD /opt/expensy/venv/bin/pip install --upgrade pip setuptools wheel
$STD /opt/expensy/venv/bin/pip install -r /opt/expensy/backend/requirements.txt
msg_ok "Python virtual environment set up"

# Build frontend
msg_info "Building frontend (this may take a few minutes)"
cd /opt/expensy/frontend
$STD npm install
$STD npm run build
msg_ok "Frontend built"

# Copy static assets to backend
msg_info "Configuring static asset serving"
mkdir -p /opt/expensy/backend/static
rm -rf /opt/expensy/backend/static/*
cp -r /opt/expensy/frontend/dist/* /opt/expensy/backend/static/
msg_ok "Configured static asset serving"

# Create secure configuration file
msg_info "Generating environment configuration"
cat <<EOF >/opt/expensy/backend/.env
SECRET_KEY=$(openssl rand -hex 32)
PORT=8000
EOF
chmod 600 /opt/expensy/backend/.env
msg_ok "Environment configuration generated"

# Create application user and set permissions
msg_info "Creating application user and configuring permissions"
useradd -r -s /bin/false expensy || true
chown -R expensy:expensy /opt/expensy
msg_ok "Application user and permissions configured"

# Create systemd service
msg_info "Installing systemd service"
cat <<EOF >/etc/systemd/system/expensy.service
[Unit]
Description=Expensy Application Service
After=network.target

[Service]
User=expensy
Group=expensy
WorkingDirectory=/opt/expensy/backend
Environment="PATH=/opt/expensy/venv/bin"
EnvironmentFile=/opt/expensy/backend/.env
ExecStart=/opt/expensy/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now expensy
msg_ok "Systemd service installed and started"

# Finalize container customization (includes autologin and MOTD welcome banner)
motd_ssh
customize
