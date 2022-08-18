i#!/bin/bash

export ES_URL=http://elastic:changeme@es:9200

export DHT11=/home/pi/git/rpi_sensor/src/test_dht11

export HUMI_TEMP=$($DHT11 | tail -1)

HUMI=$(echo $HUMI_TEMP | tr "," "\n" | head -1)
TEMP=$(echo $HUMI_TEMP | tr "," "\n" | tail -1)

TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S%z")

echo "HUMI $HUMI"
echo "TEMP $TEMP"


curl -X POST "$ES_URL/temphumi/_doc/?pretty" \
-H 'Content-Type: application/json' \
-d"
{
  \"@timestamp\": \"$TIMESTAMP\",
  \"temp\": $TEMP,
  \"humi\": $HUMI
}
"

