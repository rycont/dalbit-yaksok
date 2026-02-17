---
title: 'Home'
layout: home
hero:
    name: 달빛약속
    text: 한글 프로그래밍 언어
    tagline: '로우레벨 코더를 넘어, 당신의 세계를 지휘하는 메이커의 도구. 달빛약속 v5.'
    actions:
        - text: v5 업데이트 내역
          link: /guide/migration-v4-to-v5
          theme: brand
        - text: 문법 배우기
          link: /language/1. getting-started
          theme: alt
features:
    - title: 붓질을 넘어 지휘로
      icon: 🎨
      details: 기계적인 구현은 AI에게 맡기십시오. 당신은 프로그램이 향해야 할 목적지와 사회적 임팩트에만 집중하는 '지휘자'가 됩니다.
    - title: 실전적인 생태계
      icon: 📦
      details: 클래스, 람다, 표준 라이브러리를 갖춘 v5는 이제 단순한 교육용 언어를 넘어 웹 앱 개발까지 가능한 실전 도구로 진화했습니다.
    - title: 정교한 진단 시스템
      icon: 🌙
      details: 불필요한 감정 소모 없이 문제의 원인을 명확히 지목하여 메이커의 사유가 중단되지 않도록 돕습니다.
    - title: GitHub에서 함께하기
      icon: 💻
      details: 정한(Rycont)과 함께 다정한 기술의 미래를 빚어가는 여정에 참여하세요.
      link: https://github.com/rycont/dalbit-yaksok
      linkText: rycont/dalbit-yaksok
---

<script setup>
const DEFAULT_CODE = `클래스, 수수료계좌(계좌)
    수수료 = 2
    약속, (금액) 출금
        전체 = 금액 + 자신.수수료
        만약 자신.잔액 < 전체 이면 
            "잔액부족" 반환하기
        
        자신.잔액 = 자신.잔액 - 전체
        "수수료출금완료" 반환하기

민수_계좌 = 새 수수료계좌("민수", 20)
민수_계좌. 5 출금 보여주기
`

const codeFromUrl = (globalThis.location && new URL(globalThis.location.href).searchParams.get('code')) || DEFAULT_CODE
</script>

## 지금 달빛약속 v5 코드 실행해보기

<code-runner id="demo-code-runner" :code="codeFromUrl" />
