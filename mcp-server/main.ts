import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPTransport } from '@hono/mcp'
import { Hono } from '@hono/hono'

import { type MachineReadableError, YaksokSession } from '@dalbit-yaksok/core'
import { z } from 'zod'

// MCP 서버 구현
const mcpServer = new McpServer({
    name: 'dalbit-yaksok-mcp-server',
    version: '1.0.0',
    description: '한국어 프로그래밍 언어 달빛약속을 실행할 수 있는 MCP 서버',
})

// 도구 호출 핸들러
mcpServer.registerTool(
    'execute',
    {
        description: '달빛약속 코드를 실행합니다',
        inputSchema: {
            code: z.string().describe('실행할 달빛약속 코드'),
        },
    },
    async (input) => {
        let output = ''

        const errors: MachineReadableError[] = []
        const session = new YaksokSession({
            stdout: (message) => {
                output += message + '\n'
            },
            stderr: (_, machineReadableError) => {
                errors.push(machineReadableError)
            },
        })

        try {
            session.addModule('main', input.code)
            const result = await session.runModule('main')

            const payload = {
                status: result.reason,
                output: output,
                errors: errors,
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(payload),
                    },
                ],
            }
        } catch (error) {
            const payload = {
                status: 'error',
                errors: [error],
            }

            return {
                structuredContent: payload,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(payload),
                    },
                ],
            }
        }
    },
)

const app = new Hono()

app.all('/mcp', async (c) => {
    const transport = new StreamableHTTPTransport()
    await mcpServer.connect(transport)
    return transport.handleRequest(c)
})

export default app
