import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import deno from '@deno/vite-plugin'

export default defineConfig(({ mode }) => ({
    root: 'dev',
    plugins: [deno(), solid(), vanillaExtractPlugin()],
    build:
        mode === 'app'
            ? {
                  // 플레이그라운드 앱 빌드: deno task build:app
                  outDir: '../dist-app',
                  emptyOutDir: true,
              }
            : {
                  // 라이브러리 빌드: deno task build
                  outDir: '../dist',
                  emptyOutDir: true,
                  lib: {
                      entry: '../src/index.ts',
                      formats: ['es'],
                      fileName: 'index',
                  },
                  rollupOptions: {
                      external: ['solid-js', 'solid-js/web', '@solidjs/web'],
                  },
              },
}))
