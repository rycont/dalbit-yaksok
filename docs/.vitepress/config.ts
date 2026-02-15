import pluginDeno from '@deno/vite-plugin'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { withSidebar } from 'vitepress-sidebar'

import type { VitePressSidebarOptions } from 'vitepress-sidebar/types'

const SIDEBAR_CONFIG: VitePressSidebarOptions = {
    hyphenToSpace: true,
    sortMenusOrderNumericallyFromLink: true,
    sortFolderTo: 'bottom',
    useTitleFromFrontmatter: true,
}

const workspacePath = new URL('../..', import.meta.url).pathname

console.log({ workspacePath })

export default defineConfig(
    withMermaid(
        withSidebar(
            {
                title: '달빛약속',
                description: '가장 아름다운 한글 프로그래밍 언어',
                themeConfig: {
                    nav: [
                        { text: '홈', link: '/' },
                        {
                            text: '언어 문법',
                            link: '/language/1. getting-started',
                        },
                        {
                            text: '라이브러리',
                            link: '/library/1. getting-started',
                        },
                        {
                            text: 'API',
                            link: '/api/',
                        },
                        {
                            text: '기여하기',
                            link: '/guide/00.introduction',
                        },
                    ],
                    socialLinks: [
                        {
                            icon: 'github',
                            link: 'https://github.com/rycont/dalbit-yaksok',
                        },
                        {
                            icon: {
                                svg: '<svg viewBox="0 0 13 7" aria-hidden="true" height="28"><path d="M0,2h2v-2h7v1h4v4h-2v2h-7v-1h-4" fill="#083344"></path><g fill="#f7df1e"><path d="M1,3h1v1h1v-3h1v4h-3"></path><path d="M5,1h3v1h-2v1h2v3h-3v-1h2v-1h-2"></path><path d="M9,2h3v2h-1v-1h-1v3h-1"></path></g></svg>',
                            },
                            link: 'https://jsr.io/@dalbit-yaksok/core',
                        },
                    ],
                    search: {
                        provider: 'local',
                    },
                },
                vite: {
                    plugins: [pluginDeno()],
                    server: {
                        fs: {
                            allow: [workspacePath],
                        },
                    },
                    build: {
                        rollupOptions: {
                            watch: {
                                include: [workspacePath],
                            },
                        },
                    },
                    ssr: {
                        noExternal: ['monaco-editor'],
                    },
                    optimizeDeps: {
                        include: ['mermaid', 'dayjs'],
                    },
                },
            },
            SIDEBAR_CONFIG,
        ),
    ),
)
