#!/bin/bash

export API_URL=https://public-api.dgkim.net

export DHT11=/home/pi/git/rpi_sensor/src/test_dht11

export HUMI_TEMP=$($DHT11 | tail -1)

HUMI=$(echo $HUMI_TEMP | tr "," "\n" | head -1)
TEMP=$(echo $HUMI_TEMP | tr "," "\n" | tail -1)

TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S%z")

echo "HUMI $HUMI"
echo "TEMP $TEMP"


curl -X POST "$API_URL/v1/temperatures/" \
-H 'Content-Type: application/json' \
-d"
{
  \"temperature\": $TEMP
}
"

