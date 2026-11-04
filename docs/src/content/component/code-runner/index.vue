<script setup lang="ts">
import { YaksokSession } from '@dalbit-yaksok/core'
import AnsiCode from 'ansi-to-html'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { basicSetup, EditorView } from 'codemirror'

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

const ansiCode = new AnsiCode()
let editorInstance: EditorView

function initializeEditor() {
    const editorElement = editorRef.value!

    editorInstance = new EditorView({
        doc: props.code,
        parent: editorElement,
        extensions: [basicSetup],
    })
}

onMounted(() => {
    initializeEditor()
    runCode()
})

onBeforeUnmount(() => {
    if (editorInstance) {
        editorInstance.destroy()
    }
})

function ansiToHtml(content: string) {
    const text = ansiCode.toHtml(content)
    return text
}

function viewAnswer() {
    editorInstance!.dispatch({
        changes: {
            from: 0,
            to: editorInstance.state.doc.length,
            insert: props.challenge.answerCode,
        },
    })
}

async function runCode() {
    stdout.value = []

    try {
        const session = new YaksokSession({
            stdout: (output) => {
                stdout.value = [...stdout.value, output]
            },
            stderr: (output) => {
                stdout.value = [...stdout.value, ansiToHtml(output)]
            },
        })

        await session
            .addModule('main', editorInstance.state.doc.toString())
            .run()
    } catch (error) {
        console.error(error)
    }
}

function share() {
    const url = new URL(window.location.href)
    url.searchParams.set('code', code.value)
    navigator.clipboard.writeText(url.href)
    alert('코드가 클립보드에 복사되었습니다.')
}

watch(stdout, () => {
    if (stdout.value.join('\n') === props?.challenge?.output) {
        alert('정답입니다!')
    }
})
</script>

<template>
    <div class="wrapper not-content" :id="props.id">
        <div class="header">
            <p>약속실행기</p>
            <button
                v-if="props.challenge && props.challenge.answerCode"
                @click="viewAnswer"
            >
                정답 보기
            </button>
            <button @click="share">코드 공유</button>
            <button @click="runCode">실행</button>
        </div>
        <div id="editor" ref="editor"></div>
        <div class="output-box">
            <div>
                <p class="output-header">출력</p>
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
    background-color: var(--sl-color-bg-nav);
    border-radius: 8px;
    border: 1px solid var(--sl-color-hairline);
}

.header {
    display: flex;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    align-items: center;
    border-bottom: 1px solid var(--sl-color-hairline);
}

.header p {
    margin: 0px;
    flex: 1;
    padding: 6px 12px;
}

button {
    align-self: stretch;
    border: none;
    padding: 6px 12px;
    margin: 0px;
    cursor: pointer;
    font-size: var(--sl-text-sm);
    box-sizing: border-box;
    background-color: transparent;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}

#editor {
    background-color: var(--sl-color-bg);
    /*margin: 0px;*/
    height: 300px;
}

.output-box {
    border-top: 1px solid var(--sl-color-hairline);
    display: flex;
}

.output-box > div {
    flex: 1;
    padding: 12px;
}

.output-box > div + div {
    border-left: 1px solid var(--sl-color-hairline);
}

.output-box pre {
    margin: 0px;
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
