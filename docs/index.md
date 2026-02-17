---
title: 'Home'
layout: home
hero:
    name: 달빛약속
    text: 한글 프로그래밍 언어
    tagline: '로우레벨 코더를 넘어, 당신의 세계를 지휘하는 메이커의 도구. 달빛약속 v5.'
    actions:
        - text: v5 새로운 기능 보기
          link: /guide/migration-v4-to-v5
          theme: brand
        - text: 문법 배우기
          link: /language/1. getting-started
          theme: alt
features:
    - title: 붓질을 넘어 지휘로
      icon: 🎨
      details: 기계적인 코드의 붓질은 AI에게 맡기십시오. 당신은 프로그램이 향해야 할 목적지와 임팩트에만 집중하는 '지휘자'가 됩니다.
    - title: 실전적인 생태계
      icon: 📦
      details: 클래스, 람다, 표준 라이브러리를 갖춘 v5는 이제 단순한 교육용 도구를 넘어 웹 앱 PoC까지 가능한 실전 언어로 진화했습니다.
    - title: 다정한 안내자
      icon: 🌙
      details: 실수를 꾸짖지 않고 부드럽게 길을 비춰주는 에러 메시지 시스템을 통해, 당신의 창조적 시도를 끝까지 응원합니다.
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
