#!/bin/bash

# you should create `aws` environment in github website

echo AWS_ACCESS_KEY_ID; read AWS_ACCESS_KEY_ID
gh secret set AWS_ACCESS_KEY_ID -e aws --body "$AWS_ACCESS_KEY_ID"

echo AWS_SECRET_ACCESS_KEY; read AWS_SECRET_ACCESS_KEY
gh secret set AWS_SECRET_ACCESS_KEY -e aws --body "$AWS_SECRET_ACCESS_KEY"
