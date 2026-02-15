---
title: 'Home'
layout: home
hero:
    name: 달빛약속
    text: 한글 프로그래밍 언어
    tagline: '달빛 아래에서 나누는 가장 아름다운 약속, 한글로 코딩하세요.'
    actions:
        - text: 문법 배우기
          link: /language/1. getting-started
          theme: brand
        - text: GitHub에서 보기
          link: https://github.com/rycont/dalbit-yaksok
          theme: alt
features:
    - title: 한국어 중심 설계
      icon: 🇰🇷
      details: 한국어의 자연스러운 문법과 조사를 그대로 반영했습니다. 읽기 쉽고 쓰기 편한 코딩을 경험하세요.
    - title: 강력한 통계 엔진
      icon: 📊
      details: 데이터 분석과 통계 처리를 언어 차원에서 지원합니다. 복잡한 수식도 한글로 명확하게 표현하세요.
    - title: 에이전트 친화적
      icon: 🤖
      details: MCP 지원을 통해 AI 에이전트와 완벽하게 소통합니다. 미래의 개발 환경을 지금 만나보세요.
    - title: 객체 지향 문법
      icon: 🏗️
      details: 클래스와 매직 메서드로 복잡한 시스템을 우아하게 설계할 수 있습니다. 한글로 만드는 견고한 아키텍처.
---

<script setup>

const DEFAULT_CODE = `약속, (음식)을/를 (사람)와/과 먹기
    "맛있는 " + 음식 + ", " + 사람 + "의 입으로 모두 들어갑니다." 보여주기

먹을_음식 = "유부초밥"
먹일_사람 = "정한"

먹을_음식을 먹일_사람과 먹기

3번 반복
    먹을_음식을 먹일_사람과 먹기
`

const codeFromUrl = (globalThis.location && new URL(globalThis.location.href).searchParams.get('code')) || DEFAULT_CODE
</script>

<div class="demo-section">
  <h2 id="지금-달빛약속-코드-실행해보기">지금 달빛약속 코드 실행해보기</h2>
  <code-runner id="demo-code-runner" :code="codeFromUrl" />
</div>

<style>
.demo-section {
  margin-top: 4rem;
  padding: 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
}
</style>
