<script setup>
import CodeRunner from '../component/code-runner/index.vue'

const code =
    new URL(window.location.href).searchParams.get('code') ||
    `약속, 예매하기(차종, 좌석?)
    만약 좌석 == 비어있음 이면
        차종 + " / 좌석 없음" 보여주기
    아니면
        차종 + " / " + 좌석 보여주기

예매하기("KTX")

예매하기
    좌석: "1A"
    차종: "새마을"
`
</script>

<template>
    <CodeRunner :code="code"></CodeRunner>
</template>
