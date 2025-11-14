import { Hono } from '@hono/hono'
import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { YaksokSession, type MachineReadableError } from '@dalbit-yaksok/core'
import { z } from 'zod'

// MCP 서버 구현
const mcpServer = new McpServer({
    name: 'dalbit-yaksok-mcp-server',
    version: '1.0.0',
    description: '한국어 프로그래밍 언어 달빛약속을 실행할 수 있는 MCP 서버',
})

// Codebook 파일 캐시
interface CodebookItem {
    title: string
    content: string
}

let codebookCache: Map<string, CodebookItem> = new Map()
let codebookFiles: string[] = []

// 서버 시작 시 Codebook 파일 로드
async function loadCodebook() {
    try {
        const codebookDir = new URL('./codebook/', import.meta.url).pathname

        // Windows 경로 처리
        const dirPath =
            codebookDir.startsWith('/') && codebookDir[2] === ':'
                ? codebookDir.slice(1)
                : codebookDir

        const files: string[] = []

        // 디렉토리 읽기
        for await (const entry of Deno.readDir(dirPath)) {
            if (entry.isFile && entry.name.endsWith('.md')) {
                files.push(entry.name)
            }
        }

        files.sort()

        // 파일 로드
        for (const file of files) {
            const filePath = `${dirPath}/${file}`
            const content = await Deno.readTextFile(filePath)
            const title = file.replace('.md', '')

            codebookCache.set(title, { title, content })
            codebookFiles.push(title)
        }

        console.log(
            `✅ ${codebookFiles.length}개의 Codebook 파일 로드 완료:`,
            codebookFiles,
        )
    } catch (error) {
        console.error('❌ Codebook 파일 로드 실패:', error)
    }
}

// 도구 호출 핸들러
mcpServer.registerTool(
    'execute',
    {
        description:
            '달빛약속 코드를 실행합니다. `입력받기` 명령어를 사용하는 경우 `stdinInputs` 파라미터로 입력값을 제공할 수 있습니다.',
        inputSchema: {
            code: z.string().describe('실행할 달빛약속 코드'),
            stdinInputs: z
                .array(z.string())
                .optional()
                .describe(
                    '`입력받기` 명령어에서 사용할 입력값 배열입니다. 코드에서 `입력받기`가 호출되는 순서대로 값이 사용됩니다. 예: `["홍길동", "30"]`',
                ),
        },
    },
    async (input) => {
        console.log('Execution called')
        let output = ''

        const errors: MachineReadableError[] = []
        const stdinInputs = input.stdinInputs ?? []
        let stdinIndex = 0

        const session = new YaksokSession({
            stdout: (message) => {
                output += message + '\n'
            },
            stderr: (_, machineReadableError) => {
                errors.push(machineReadableError)
            },
            stdin: (question) => {
                // 질문이 있으면 출력에 포함
                if (question) {
                    output += question + '\n'
                }

                // 입력값 배열에서 순서대로 반환
                if (stdinIndex < stdinInputs.length) {
                    const value = stdinInputs[stdinIndex]
                    stdinIndex++
                    return Promise.resolve(value)
                }

                // 입력값이 없으면 빈 문자열 반환
                return Promise.resolve('')
            },
        })

        session.addModule('main', input.code)
        try {
            const result = await session.runModule('main')

            const payload = {
                status: result.reason,
                output: output,
                errors: errors,
            }

            console.log('Execution finished')

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(payload),
                    },
                ],
            }
        } catch (e) {
            console.error('Execution error:', e)
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            status: 'Unexpected Error. This might not be your fault.',
                            output: output,
                            errors: errors,
                        }),
                    },
                ],
            }
        }
    },
)

const codebookFileNames = codebookFiles.map((f) =>
    f.replace('.md', '').replace('-', ' '),
)

// Codebook 탐색 도구
mcpServer.registerTool(
    'searchDocument',
    {
        description: `달빛약속 문법책의 내용을 검색합니다. 당신은 달빛약속의 문법을 전혀 모르기 때문에, 모든 프로그래밍 언어를 구현하기 전에 문법을 검색해야 합니다.\n\n 검색 예시:\n${codebookFileNames.join(
            ', ',
        )}`,
        inputSchema: {
            query: z.string().describe('검색 키워드'),
        },
    },
    async (input) => {
        console.log('Search called', input.query)
        const queries = input.query.toLowerCase().split(' ')

        const result = [...codebookCache.entries()]
            .filter(([_, value]) =>
                queries.some(
                    (query) =>
                        value.title.toLowerCase().includes(query) ||
                        value.content.toLowerCase().includes(query),
                ),
            )
            .map(([key, value]) => value.content)

        console.log('Search finished:', result.length, 'results found')

        return {
            content: [
                {
                    type: 'text',
                    text: result.join('\n\n---\n\n'),
                },
            ],
        }
    },
)

const app = new Hono()

app.all('/mcp', async (c) => {
    // 초기화 시 codebook 로드 (첫 요청 시)
    if (codebookCache.size === 0) {
        await loadCodebook()
    }

    const transport = new StreamableHTTPTransport()
    await mcpServer.connect(transport)
    return transport.handleRequest(c)
})

export default app
