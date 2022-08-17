#!/bin/bash

./local-dynamodb.sh create-table \
--table-name TemperatureTable-dev \
--attribute-definitions AttributeName=datetime,AttributeType=S \
--key-schema AttributeName=datetime,KeyType=HASH \
--billing-mode PAY_PER_REQUEST
