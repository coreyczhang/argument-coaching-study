#!/bin/bash
set -e

# Persist the env the agent needs into a dedicated file. The EB deployment env
# file path varies by platform and is ephemeral, so we build our own from
# whatever's available: the deployment env (if present) plus the specific vars
# exported into this hook's environment.
ENV_FILE=/etc/uvicorn-agent.env
: > "$ENV_FILE"
if [ -f /opt/elasticbeanstalk/deployment/env ]; then
  cp /opt/elasticbeanstalk/deployment/env "$ENV_FILE"
fi
{
  [ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
  [ -n "$ANTHROPIC_MODEL" ]   && echo "ANTHROPIC_MODEL=$ANTHROPIC_MODEL"
} >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

cat > /etc/systemd/system/uvicorn-agent.service <<EOF
[Unit]
Description=Point Taken AI Agent
After=network.target

[Service]
WorkingDirectory=/var/app/current/agent
# '-' makes the file optional so a missing/late env file never blocks startup.
EnvironmentFile=-${ENV_FILE}
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
# Don't fail the whole deploy if the agent doesn't come up on the first try;
# Restart=always will keep retrying and the Node backend still serves.
systemctl restart uvicorn-agent || true
