import { YaksokSession, ListValue, NumberValue, StringValue } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

const session = new YaksokSession()
const std = new StandardExtension()
await session.extend(std, { baseContextFileName: ['표준'] })

// MAP 테스트용 가상 FFI 실행
const list = new ListValue([new NumberValue(1), new NumberValue(2), new NumberValue(3)])

// 가상 람다 객체 생성
const mockLambda = {
    paramNames: ['n'],
    run: async (args: any) => {
        return new NumberValue(args.n.value * 2)
    },
    toPrint: () => 'lambda',
} as any

const result = await std.executeFFI('MAP', { 자신: list, 변환함수: mockLambda } as any, session.currentScope)

console.log('MAP 결과:', result.toPrint())

// ListValue의 내부 구조 확인을 위해 enumerate() 사용
const resultList = Array.from((result as ListValue).enumerate())
if (resultList.length === 3 && (resultList[0] as NumberValue).value === 2) {
    console.log('테스트 성공!')
} else {
    console.error('테스트 실패')
    Deno.exit(1)
}
