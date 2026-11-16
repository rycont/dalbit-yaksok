---
title: '파서 이사 대작전'
---

2023년 12월 이래로 Bottom-Up(Shift Reduce) 파서를 줄곧 써왔습니다. SR 파서는 겉으로 드러나는 구현이 간단하다는 강력한 장점이 있습니다.

```
Evaluable Operator Evaluable -> BinaryOperation
```

달빛약속에서 사용하던 파서는 위와 같이 규칙을 표현합니다.
