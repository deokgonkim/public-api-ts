#!/bin/bash

aws dynamodb --endpoint-url http://localhost:8000 $@
