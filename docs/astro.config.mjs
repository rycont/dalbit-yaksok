import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc'
import mdx from '@astrojs/mdx'
import vue from '@astrojs/vue'

export default defineConfig({
    integrations: [
        starlight({
            tableOfContents: false,
            title: '달빛약속',
            description: '한국어 프로그래밍 언어',
            social: [
                {
                    icon: 'github',
                    label: '깃허브',
                    href: 'https://github.com/rycont/dalbit-yaksok',
                },
                {
                    icon: 'jsr',
                    label: 'JSR',
                    href: 'https://jsr.io/@dalbit-yaksok/core',
                },
            ],
            pagination: false,
            customCss: ['./src/fonts/interlude.css', './src/styles/custom.css'],
            plugins: [
                starlightTypeDoc({
                    entryPoints: ['../core/mod.ts'],
                    tsconfig: '../tsconfig.json',
                    typeDoc: {
                        name: '달빛약속',
                        categorizeByGroup: true,
                        plugin: ['typedoc-plugin-markdown'],
                        skipErrorChecking: true,
                    },
                    sidebar: {
                        collapsed: true,
                        label: '명세',
                    },
                }),
            ],
            sidebar: [
                {
                    label: '라이브러리',
                    items: [{ autogenerate: { directory: 'library' } }],
                },
                {
                    label: '언어',
                    items: [{ autogenerate: { directory: 'language' } }],
                },
                typeDocSidebarGroup,
            ],
        }),
        mdx(),
        vue(),
    ],
})
