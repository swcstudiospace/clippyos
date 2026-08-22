#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
export SUPABASE_SECRET_KEY="${SUPABASE_SECRET_KEY:-sb_secret_Zrc_b_jnhlijVtVestVABA_VDV1AE_M}"
npm run dev >>/tmp/app-startup.log 2>&1 &
