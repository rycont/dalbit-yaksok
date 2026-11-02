import { defineConfig } from 'vite-plus'

export default defineConfig({
    fmt: {
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        tabWidth: 4,
        printWidth: 80,
        sortPackageJson: false,
        ignorePatterns: ['docs/api/**', 'docs/.vitepress/dist/**'],
    },
    lint: {
        $schema: './node_modules/oxlint/configuration_schema.json',
        plugins: ['typescript', 'unicorn', 'oxc'],
        categories: {
            correctness: 'error',
        },
        rules: {
            'typescript/no-explicit-any': 'off',
        },
        env: {
            builtin: true,
        },
        ignorePatterns: ['docs/.vitepress/dist', 'docs/api', 'node_modules'],
    },
    run: {
        cache: true,
    },
})
