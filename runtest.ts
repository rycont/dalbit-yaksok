import { YaksokSession } from '@dalbit-yaksok/core'
import { DataAnalyze } from '@dalbit-yaksok/dala-analyze'
import { 편의점 } from "./data-analyze/virtual-data/편의점.ts";

// const result = await yaksok(`정의 되지 않은 약속`)
const session = new YaksokSession({
    stdout: (text) => {
        console.log(text)
    },
})

await session.extend(new DataAnalyze())

session.addModule("main", `
편의점_상품들 = @데이터_불러오기 편의점 데이터
@분석 편의점_상품들 중 '상품ID'가 'CVS003'인 값 보여주기
@분석 (@분석 편의점_상품들 중 '가격'이 2000 이상인 것들) '재고' 순서로 정렬 보여주기
`)
await session.runModule('main')
