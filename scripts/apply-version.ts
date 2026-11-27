import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('../', import.meta.url))

interface PackageJson {
    name?: string
    version?: string
    [key: string]: unknown
}

/** pnpm-workspace.yaml의 packages: 목록을 읽어온다. */
async function readWorkspacePatterns(): Promise<string[]> {
    const yaml = await readFile(join(rootDir, 'pnpm-workspace.yaml'), 'utf8')

    const patterns: string[] = []
    let inPackages = false

    for (const line of yaml.split('\n')) {
        if (/^\S/.test(line)) {
            inPackages = line.startsWith('packages:')
            continue
        }

        if (!inPackages) continue

        const entry = line.match(/^\s*-\s*(.+)$/)?.[1]
        if (entry) {
            patterns.push(entry.trim().replace(/\/+$/, ''))
        }
    }

    return patterns
}

/** `exts/statement/*` 같은 패턴을 실제 디렉터리로 전개한다. */
async function expandPattern(
    segments: string[],
    base: string,
): Promise<string[]> {
    if (segments.length === 0) {
        return [base]
    }

    const [head, ...rest] = segments

    if (!head.includes('*')) {
        return expandPattern(rest, `${base}/${head}`)
    }

    const regex = new RegExp(`^${head.replaceAll('*', '[^/]+')}$`)
    const entries = await readdir(join(rootDir, base), {
        withFileTypes: true,
    })

    const matched = entries.filter(
        (entry) => entry.isDirectory() && regex.test(entry.name),
    )

    return (
        await Promise.all(
            matched.map((entry) =>
                expandPattern(rest, `${base}/${entry.name}`),
            ),
        )
    ).flat()
}

const rootPackage: PackageJson = JSON.parse(
    await readFile(join(rootDir, 'package.json'), 'utf8'),
)

const patterns = await readWorkspacePatterns()
const packageDirs = [
    ...new Set(
        (
            await Promise.all(
                patterns.map((pattern) =>
                    expandPattern(pattern.split('/'), '.'),
                ),
            )
        ).flat(),
    ),
]

for (const packageDir of packageDirs) {
    const packageJsonPath = join(rootDir, packageDir, 'package.json')

    let packageJson: PackageJson
    try {
        packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
    } catch {
        continue
    }

    // version 필드가 없는 패키지는 퍼블리시 대상이 아니므로 건너뛴다.
    if (packageJson.version === undefined) {
        continue
    }

    packageJson.version = rootPackage.version

    await writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 4) + '\n',
        'utf8',
    )

    console.log(`${packageDir}: ${rootPackage.version}`)
}
