<script setup lang="ts">
import {
    YaksokSession,
    CodeFile,
    parse,
    FEATURE_FLAG,
} from '@dalbit-yaksok/core'
import AnsiCode from 'ansi-to-html'
import type { editor } from 'monaco-editor'
import { onMounted, ref, useTemplateRef, watch } from 'vue'

import { loadMonaco } from './load-monaco'

const props = defineProps({
    code: {
        type: String,
        default: '',
    },
    challenge: {
        type: Object,
        default: null,
    },
    id: {
        type: String,
        default: '',
    },
})

const editorRef = useTemplateRef('editor')

const code = ref(props.code)
const stdout = ref<string[]>([])

let editorInstance: editor.IStandaloneCodeEditor | null = null
let monaco: Awaited<ReturnType<typeof loadMonaco>> | null = null

const ansiCode = new AnsiCode()

async function initializeMonaco() {
    const editorElement = editorRef.value!

    const { DalbitYaksokApplier, LANG_ID } = await import(
        '@dalbit-yaksok/monaco-language-provider'
    )

    monaco = await loadMonaco()

    const languageProvider = new DalbitYaksokApplier(code.value)
    languageProvider.register(monaco.languages)

    editorInstance = monaco.editor.create(editorElement, {
        automaticLayout: true,
        value: code.value,
        fontFamily: 'var(--vp-font-family-mono)',
        minimap: {
            enabled: false,
        },
        language: LANG_ID,
        theme: 'vs',
        guides: {
            highlightActiveIndentation: false,
            indentation: false,
        },
        renderLineHighlight: 'none',
        lineNumbers: 'off',
    })

    editorInstance.onDidChangeModelContent(() => {
        const updatedCode = editorInstance!.getValue()
        code.value = updatedCode
    })

    languageProvider.configEditor(editorInstance)

    editorInstance.onDidFocusEditorText(() => {
        editorInstance!.addCommand(
            monaco!.KeyMod.CtrlCmd | monaco!.KeyCode.Enter,
            runCode,
        )
    })
}

onMounted(() => {
    initializeMonaco().then(runCode)
})

function ansiToHtml(content) {
    const text = ansiCode.toHtml(content)
    return text
}

function viewAnswer() {
    editorInstance!.setValue(props.challenge.answerCode)
}

let prevDecorations: editor.IEditorDecorationsCollection | null = null

async function runCode() {
    if (!monaco) {
        monaco = await loadMonaco()
    }

    stdout.value = []

    try {
        const session = new YaksokSession({
            flags: {
                [FEATURE_FLAG.DISABLE_OPERAND_EXECUTION_DELAY]: true,
            },
            stdout: (output) => {
                stdout.value = [...stdout.value, output]
            },
            stderr: (output) => {
                stdout.value = [...stdout.value, ansiToHtml(output)]
            },
            events: {
                runningCode(start, end, scope, tokens) {
                    const range = new monaco!.Range(
                        start.line,
                        start.column,
                        end.line,
                        end.column,
                    )

                    const decorations =
                        editorInstance?.createDecorationsCollection([
                            {
                                range,
                                options: {
                                    className: 'running-code',
                                },
                            },
                        ])

                    if (prevDecorations) {
                        prevDecorations.clear()
                    }

                    if (decorations) {
                        prevDecorations = decorations
                    }
                },
            },
        })

        const c = new CodeFile(code.value)
        console.log(code.value, c.ast.children, parse(c))

        session.addModule('main', code.value, {
            // executionDelay: 400,
        })

        console.log(await session.runModule('main'))
    } catch (error) {
        console.error(error)
    }

    if (prevDecorations) {
        setTimeout(() => {
            ;(prevDecorations as editor.IEditorDecorationsCollection).clear()
        }, 400)
    }
}

function share() {
    const url = new URL(window.location.href)
    url.searchParams.set('code', code.value)
    navigator.clipboard.writeText(url.href)
    alert('코드가 클립보드에 복사되었습니다.')
}

watch(stdout, (output) => {
    if (stdout.value.join('\n') === props?.challenge?.output) {
        alert('정답입니다!')
    }
})
</script>

<template>
    <div class="wrapper" :id="props.id">
        <div class="header">
            <p>약속실행기</p>
            <button
                v-if="props.challenge && props.challenge.answerCode"
                @click="viewAnswer"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11.0026 16L6.75999 11.7574L8.17421 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"
                    ></path>
                </svg>
                정답 보기
            </button>
            <button @click="share">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M18.3638 15.5355L16.9496 14.1213L18.3638 12.7071C20.3164 10.7545 20.3164 7.58866 18.3638 5.63604C16.4112 3.68341 13.2453 3.68341 11.2927 5.63604L9.87849 7.05025L8.46428 5.63604L9.87849 4.22182C12.6122 1.48815 17.0443 1.48815 19.778 4.22182C22.5117 6.95549 22.5117 11.3876 19.778 14.1213L18.3638 15.5355ZM15.5353 18.364L14.1211 19.7782C11.3875 22.5118 6.95531 22.5118 4.22164 19.7782C1.48797 17.0445 1.48797 12.6123 4.22164 9.87868L5.63585 8.46446L7.05007 9.87868L5.63585 11.2929C3.68323 13.2455 3.68323 16.4113 5.63585 18.364C7.58847 20.3166 10.7543 20.3166 12.7069 18.364L14.1211 16.9497L15.5353 18.364ZM14.8282 7.75736L16.2425 9.17157L9.17139 16.2426L7.75717 14.8284L14.8282 7.75736Z"
                    ></path>
                </svg>
                코드 공유
            </button>
            <button @click="runCode">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z"
                    ></path>
                </svg>
                실행 (Ctrl + Enter)
            </button>
        </div>
        <div id="editor" ref="editor"></div>
        <div class="output-box">
            <div>
                <h2 class="output-header">출력</h2>
                <pre><div
                v-for="(output, index) in stdout"
                :key="index"
                v-html="output"
            ></div></pre>
            </div>
            <div v-if="props.challenge && props.challenge.output">
                <h2 class="output-header">목표 출력</h2>
                <pre>{{ props.challenge.output }}</pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    display: flex;
    flex-direction: column;
    background-color: var(--vp-c-bg-alt);
    border-radius: 8px;
    border: 1px solid var(--vp-c-border);
}

.header {
    display: flex;
    background-color: var(--vp-c-bg-alt);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    align-items: center;
    border-bottom: 1px solid var(--vp-c-border);
}

.header p {
    color: var(--vp-c-text-2);
    margin: 0px;
    flex: 1;
    padding: 6px 12px;
}

button {
    align-self: stretch;
    color: var(--vp-c-text-1);
    border: none;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 16px;
    box-sizing: border-box;
    transition: background-color 0.2s;
    border-left: 1px solid var(--vp-c-border);
    display: flex;
    align-items: center;
    gap: 6px;
}

button:hover {
    background-color: var(--vp-c-gray-1);
}

button svg {
    width: 16px;
    height: 16px;
}

textarea {
    padding: 12px;
    width: 100%;
    height: 200px;
    font-family: var(--vp-font-family-mono);
    line-height: 1.5;
    box-sizing: border-box;
    transition: box-shadow 0.2s;
    font-size: 14px;
    background: var(--vp-c-bg);
}

textarea:focus {
    box-shadow: inset 0 0 0 1px var(--vp-c-brand-1);
}

textarea:read-only {
    border-color: var(--vp-c-border);
    border-width: 1px;
    border-style: solid;
    background-color: transparent;
}

#editor {
    height: 300px;
}

.output-box {
    border-top: 1px solid var(--vp-c-border);
    display: flex;
}

.output-box > div {
    flex: 1;
    padding: 12px;
}

.output-box > div + div {
    border-left: 1px solid var(--vp-c-border);
}

pre {
    margin: 0px;
    font-family: var(--vp-font-family-mono);
    box-sizing: border-box;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.3;
}

h2.output-header {
    font-size: 16px;
    margin: 0px;
    padding: 0px;
    border: none;
    border-top: none;
    line-height: revert;
    margin-bottom: 6px;
    letter-spacing: normal;
}
</style>
