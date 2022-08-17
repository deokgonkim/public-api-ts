#!/bin/bash

source env.sh

export APP_ID=public-api-ts
# DEPLOYMENT_BUCKET should be defined in env.sh
#export DEPLOYMENT_BUCKET=
export STACK_NAME=public-api-ts-role

aws cloudformation \
deploy \
--stack-name $STACK_NAME \
--template-file ./cloudformation.yaml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides \
"AppId=$APP_ID" \
"DeploymentBucket=${DEPLOYMENT_BUCKET}"
