#!/bin/bash

set -a
source ../.env
set +a

export URL=https://${DOMAIN_NAME}/v1/temperatures/
echo "URL : ${URL}"

curl -X 'POST' \
  $URL \
  -H 'accept: */*' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'temperature=28.5'
