import { NumberValue, StringValue, yaksok } from '@dalbit-yaksok/core'

await yaksok(
    `
번역(JavaScript), 입력받기/입력받부기
***
    return prompt()
***

번역(JavaScript), (message) 입력받기
***
    return prompt(message)
***

입력받기 + 4 보여주기
`,
    {
        async runFFI(_runtime, code, args) {
            const paramNames = Object.keys(args)
            const paramsInJS = Object.fromEntries(
                Object.entries(args).map(([key, value]) => [
                    key,
                    typeof value.toPrint() === 'string'
                        ? `"${value.toPrint()}"`
                        : value.toPrint(),
                ]),
            )

            const returnInJS = await eval(
                `(async (${paramNames.join(
                    ', ',
                )}) => {${code}})(${Object.values(paramsInJS).join(', ')})`,
            )

            if (Number.isNaN(Number(returnInJS)))
                return new StringValue(returnInJS)
            return new NumberValue(Number(returnInJS))
        },
    },
)
