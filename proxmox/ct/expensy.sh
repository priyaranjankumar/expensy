#!/usr/bin/env bash

# Copyright (c) 2021-2026 community-scripts ORG
# Author: priyaranjankumar
# License: MIT | https://github.com/community-scripts/ProxmoxVE/raw/main/LICENSE
# Source: https://github.com/priyaranjankumar/expensy

source <(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/misc/build.func)

APP="Expensy"
var_tags="${var_tags:-finance;expense}"
var_cpu="${var_cpu:-1}"
var_ram="${var_ram:-256}"
var_disk="${var_disk:-4}"
var_os="${var_os:-ubuntu}"
var_version="${var_version:-24.04}"
var_unprivileged="${var_unprivileged:-1}"
var_arm64="${var_arm64:-yes}"

header_info "$APP"
variables
color
catch_errors

# Set our custom installer path after variables is called
var_install="../../../../priyaranjankumar/expensy/main/proxmox/install/expensy-install"

function update_script() {
  header_info
  check_container_storage
  check_container_resources
  if [[ ! -d /opt/expensy ]]; then
    msg_error "No ${APP} Installation Found!"
    exit
  fi

  msg_info "Updating ${APP} inside container"
  # Stop service
  systemctl stop expensy

  # Pull changes from main branch
  cd /opt/expensy
  git config --global --add safe.directory /opt/expensy
  git pull origin main

  # Update python dependencies
  source venv/bin/activate
  pip install --upgrade pip setuptools wheel
  pip install -r backend/requirements.txt

  # Rebuild frontend
  cd frontend
  npm install
  npm run build

  # Re-copy built static files to backend
  rm -rf ../backend/static/*
  cp -r dist/* ../backend/static/

  # Fix permissions
  chown -R expensy:expensy /opt/expensy

  # Restart service
  systemctl start expensy
  msg_ok "Updated ${APP} successfully"
}

start
build_container
description
