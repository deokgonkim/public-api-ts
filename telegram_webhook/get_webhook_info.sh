#!/bin/bash

source ../env.sh

curl -X GET https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
