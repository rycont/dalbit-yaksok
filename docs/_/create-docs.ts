import { Application } from 'typedoc'

const app = await Application.bootstrapWithPlugins({
    entryPoints: ['../core/mod.ts', '../monaco-language-provider/mod.ts'],
    name: '달빛약속',
    categorizeByGroup: true,
    plugin: ['typedoc-plugin-markdown', 'typedoc-vitepress-theme'],
    skipErrorChecking: true,
})

const VALID_OPERATIONS = ['create', 'modify', 'rename', 'remove']

const isWatch = Deno.args.includes('--watch')
const CWD = Deno.cwd()

async function buildMarkdownDocs() {
    const project = await app.convert()
    if (project) {
        await app.generateOutputs(project)
    }
}

await buildMarkdownDocs()

if (!isWatch) {
    Deno.exit(0)
}

console.log('Waiting for file changes...')

const watcher = Deno.watchFs(
    ['\\..\\..\\core', '\\..\\..\\monaco-language-provider'].map(
        (path) => import.meta.dirname + path,
        // (path) => new URL(path, import.meta.url).pathname,
    ),
    {
        recursive: true,
    },
)

for await (const event of watcher) {
    const type = event.kind
    const isValidOperation = VALID_OPERATIONS.includes(type)

    const paths = event.paths.map(clarifyPath)
    const message = `[${type}] ${paths.join(', ')}`

    if (!isValidOperation) {
        continue
    }

    console.log(message)
    buildMarkdownDocs()
}

function clarifyPath(path: string) {
    if (path.startsWith(CWD)) {
        path = path.slice(CWD.length)
    }

    while (true) {
        if (path.startsWith('/')) {
            path = path.slice(1)
            continue
        }

        if (path.startsWith('./')) {
            path = path.slice(1)
            continue
        }

        break
    }

    return path
}
