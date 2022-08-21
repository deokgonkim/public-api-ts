aws dynamodb scan --table-name public-api-ts-TemperatureTable-dev \
    --filter-expression "begins_with(#dt, :datetime)" \
    --expression-attribute-names '{"#dt": "datetime"}' \
    --expression-attribute-values '{":datetime":{"S":"2022-08-21"}}' \
    --page-size 5 \
    --max-items 5 $@
#    --debug
