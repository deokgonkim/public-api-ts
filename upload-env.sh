#!/bin/bash

aws s3 cp ./.env.dev s3://dgkimnet-deploy/public-api-dev.dgkim.net/.env.dev
aws s3 cp ./service-account.json s3://dgkimnet-deploy/public-api-dev.dgkim.net/service-account.json
