#!/bin/bash
set -e

cat > /etc/systemd/system/uvicorn-agent.service <<EOF
[Unit]
Description=Point Taken AI Agent
After=network.target

[Service]
WorkingDirectory=/var/app/current/agent
EnvironmentFile=/opt/elasticbeanstalk/deployment/env
ExecStart=/opt/point-taken-agent-venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable uvicorn-agent
systemctl restart uvicorn-agent
