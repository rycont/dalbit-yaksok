import {
    Extension,
    ExtensionManifest,
    FunctionInvokingParams,
    Scope,
    StringValue,
    ValueType,
    YaksokSession,
} from '@dalbit-yaksok/core'

const session = new YaksokSession()

class TestExtension implements Extension {
    manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: 'Test',
        },
    }

    executeFFI(
        code: string,
        args: FunctionInvokingParams,
        callerScope: Scope,
    ): ValueType {
        console.log(callerScope.codeFile?.fileName)
        return new StringValue('Hello, world!')
    }
}

session.extend(new TestExtension())

session.addModule(
    'main',
    `
번역(Test), 안녕
***
뭐시기
***

안녕
`,
)

session.validate()
const result = await session.runModule('main')