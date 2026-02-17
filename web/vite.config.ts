import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            // core 패키지의 실제 위치를 가리킴
            '@dalbit-yaksok/core': path.resolve(__dirname, '../core/mod.ts'),
        },
    },
    server: {
        port: 3000,
        fs: {
            allow: ['..'],
        },
    },
})
