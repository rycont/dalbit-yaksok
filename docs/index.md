---
title: 'Home'
layout: home
hero:
    name: 달빛약속
    text: 한글 프로그래밍 언어
    tagline: '약속 프로그래밍 언어의 포크, Formerly known as "Yaksok.ts"'
    # actions:
    #     - text: 달빛약속 문법 배우기
    #       link: /language/1. getting-started
    #       theme: brand
features:
    - title: 문법 배우기
      icon: 📚
      link: /language/1. getting-started
      details: 달빛약속의 문법을 배웁니다
      linkText: 튜토리얼
    - title: 라이브러리로 사용하기
      icon: 📦
      link: /library/1. getting-started
      details: 달빛약속을 앱에 통합하는 방법을 알아보세요
      linkText: 빠른 시작
    - title: GitHub에서 코드 보기
      icon: 💻
      details: 소스코드와 이슈를 공유합니다
      link: https://github.com/rycont/dalbit-yaksok
      linkText: rycont/dalbit-yaksok
    - title: 코드베이스 이해하기(기여하기)
      icon: ⚙️
      link: /guide/00.introduction.md
      details: 친절한 튜토리얼이 기다리고 있습니다
      linkText: Guide
---

<script setup>

const DEFAULT_CODE = `약속, 키가 (키)cm이고 몸무게가 (몸무게)일 때 비만도
    몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (170)cm이고 몸무게가 (70)일 때 비만도

비만도 보여주기
비만도 보여줄까말까
`

const codeFromUrl = (globalThis.location && new URL(globalThis.location.href).searchParams.get('code')) || DEFAULT_CODE
</script>

## 지금 달빛약속 코드 실행해보기

<code-runner id="demo-code-runner" :code="codeFromUrl" />
