import * as handler from '../handler'

test('handler list', async () => {
    const result = await handler.list({}, null, null)
    // console.log(`result ${JSON.stringify(result)}`)
    expect(result).toHaveProperty('body')
    expect(result).toHaveProperty('statusCode')
    const body = JSON.parse(result.body)
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('data')
    console.log(body.data)
})
