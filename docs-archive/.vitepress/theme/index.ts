import DefaultTheme from 'vitepress/theme-without-fonts'

import './custom.css'
import type { Theme } from 'vitepress'

import CodeRunner from '../../_/code-runner/index.vue'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('code-runner', CodeRunner)
    },
} satisfies Theme
