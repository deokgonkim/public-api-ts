
import * as dynamodb from '../lib/dynamodb'

let inserted_datetime

test('test listTables', async () => {
    const result = await dynamodb.listTables()
    expect(result).toHaveProperty('TableNames')
    expect(result.TableNames!.length > 0).toBeTruthy()
})

test('insert data', async () => {
    const temperature = 28.5
    const result = await dynamodb.insertTemperature(String(temperature))
    console.log(`result ${JSON.stringify(result, null, 4)}`)
    expect(result).toHaveProperty('Item')
    expect(result.Item!.datetime).toHaveProperty('S')
    inserted_datetime = result.Item!.datetime.S!
})

test('get data', async () => {
    // const datetime = '2022-08-16T09:16:59.721Z'
    const result = await dynamodb.getTemperatureAt(inserted_datetime)
    console.log(`result ${JSON.stringify(result)}`)
    expect(result).toHaveProperty('Item')
    expect(result.Item!).toHaveProperty('datetime')
})

test('get list', async () => {
    const result = await dynamodb.getAllTemperatures('2022-08-21', 2)
    console.log(`result ${JSON.stringify(result)}`)
    expect(result).toHaveProperty('Items')
    expect(result.Items!.length > 0).toBeTruthy()
    const lek = result.LastEvaluatedKey
    const result2 = await dynamodb.getAllTemperatures('2022-08-21', 2, lek)
    console.log(`result ${JSON.stringify(result2)}`)
    expect(result2).toHaveProperty('Items')
    expect(result2.Items!.length > 0).toBeTruthy()
})