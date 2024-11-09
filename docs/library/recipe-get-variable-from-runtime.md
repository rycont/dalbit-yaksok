---
title: '레시피: 런타임에서 변수 가져오기'
---

# 레시피: 런타임에서 변수 가져오기

약속 코드가 실행이 끝난 뒤엔 런타임에서 변수를 가져올 수 있습니다.

```
import { yaksok } from '@yaksok-ts/core'

const code = `
내_이름: "영희"
`

const result = yaksok(code)
console.log(result.getRunner().scope.getVariable('내_이름').value)
```

자세히 알아보려면 다음 문서를 참조하세요:

-