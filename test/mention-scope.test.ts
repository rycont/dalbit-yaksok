import { YaksokSession } from '@dalbit-yaksok/core'
import { test, expect } from 'vite-plus/test'
import { FileForRunNotExistError } from '../core/error/prepare.ts'

test('MentionScope validate with invalid module', async () => {
    const session = new YaksokSession()

    // Should have error about module not found
    try {
        session.addModule('main', `@없는모듈 변수`)
        expect.unreachable()
    } catch (error) {
        expect(error).toBeInstanceOf(FileForRunNotExistError)
    }
})

test('MentionScope validate with module that has validation errors', async () => {
    const session = new YaksokSession()

    await session.addModule('module', `변수 = 1`).run()
    const codeFile = session.addModule('main', `@module 변수`)

    // Should work fine with valid module
    await codeFile.run()
})

test('MentionScope execute with non-YaksokError', async () => {
    const session = new YaksokSession()

    await session.addModule('module', `변수 = 1`).run()
    const codeFile = session.addModule('main', `@module 변수`)

    await codeFile.run()
})
