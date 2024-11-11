#!/bin/bash

source ../env.sh

export TELEGRAM_WEBHOOK_URL=${API_BASE_URL}/telegram/

curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${TELEGRAM_WEBHOOK_URL}
