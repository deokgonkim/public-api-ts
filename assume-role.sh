#!/bin/bash

export APP_ID=public-api-ts
export ACCOUNT_ID=$(aws sts get-caller-identity | jq -r .Account)

CREDS=`aws sts assume-role --role-arn arn:aws:iam::${ACCOUNT_ID}:role/${APP_ID}-role-DeployerRole --role-session-name=gha_deployer`
export AWS_ACCESS_KEY_ID=`echo $CREDS | jq -r '.Credentials.AccessKeyId'`
export AWS_SECRET_ACCESS_KEY=`echo $CREDS | jq -r '.Credentials.SecretAccessKey'`
export AWS_SESSION_TOKEN=`echo $CREDS | jq -r '.Credentials.SessionToken'`

unset AWS_PROFILE
