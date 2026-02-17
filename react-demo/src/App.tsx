import { useCallback, useEffectEvent, useState } from 'react'
import { type Position, YaksokSession } from '@dalbit-yaksok/core'

export default function App() {
    const [code, setCode] = useState(`약속, (메시지) 입력받기
    이것저것`)
    const [stdout, setStdout] = useState<string[]>([])

    const [startedAt, setStartedAt] = useState<number | null>(null)
    const [endedAt, setEndedAt] = useState<number | null>(null)

    const runCode = useEffectEvent(() => {
        const session = new YaksokSession({
            stdout: (data: string) => setStdout((stdout) => [...stdout, data]),
            events: {
                runningCode(start: Position, end: Position) {
                    // setStdout((stdout) => [...stdout, start.line])
                },
            },
        })
        session.addModule('main', code)
        setStartedAt(Date.now())
        session.runModule('main').then(() => {
            setEndedAt(Date.now())
        })
    })

    return (
        <>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                cols={50}
            />
            <button onClick={runCode}>Run Code</button>
            <div>
                <h2>Output</h2>
                <pre>
                    {stdout.length > 0 ? stdout.join('\n') : 'No output yet'}
                </pre>
                {startedAt && endedAt && (
                    <p>Execution time: {endedAt - startedAt} ms</p>
                )}
            </div>
        </>
    )
}
