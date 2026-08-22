import { createSignal } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { YaksokSession } from '@dalbit-yaksok/core'
import { runButton, label, output, textarea, wrapper } from './editor.css.ts'

export interface YaksokEditorProps {
    /** 에디터에 미리 채워둘 약속 코드 */
    initialCode?: string
    /** 실행 버튼에 표시할 문구 */
    runLabel?: string
}

/**
 * 달빛약속 코드를 작성하고 실행할 수 있는 에디터 컴포넌트.
 * `@dalbit-yaksok/core` 런타임과 직접 연동됩니다.
 */
export function YaksokEditor(props: YaksokEditorProps): JSX.Element {
    const [code, setCode] = createSignal(props.initialCode ?? '')
    const [lines, setLines] = createSignal<string[]>([])
    const [running, setRunning] = createSignal(false)

    const run = async () => {
        setRunning(true)
        setLines([])
        try {
            const session = new YaksokSession({
                stdout: (message) => setLines((prev) => [...prev, message]),
                stderr: (message) => setLines((prev) => [...prev, message]),
            })
            session.addModule('main', code())
            await session.runModule('main')
        } catch (error) {
            setLines((prev) => [...prev, String(error)])
        } finally {
            setRunning(false)
        }
    }

    return (
        <div class={wrapper}>
            <p class={label}>약속 코드</p>
            <textarea
                class={textarea}
                value={code()}
                onInput={(event) => setCode(event.currentTarget.value)}
                spellcheck={false}
            />
            <button
                class={runButton}
                onClick={run}
                disabled={running()}
            >
                {running() ? '실행 중…' : (props.runLabel ?? '실행하기')}
            </button>
            <p class={output}>
                {lines().length > 0 ? lines().join('\n') : '출력이 여기에 표시됩니다'}
            </p>
        </div>
    )
}
