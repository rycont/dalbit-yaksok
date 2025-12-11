import { YaksokSession } from '@dalbit-yaksok/core'
import { DataAnalyze } from '@dalbit-yaksok/dala-analyze'
import { 편의점 } from "./data-analyze/virtual-data/편의점.ts";

const session = new YaksokSession()

const dataAnalyze = new DataAnalyze()
await session.extend(dataAnalyze)
await session.setBaseContext(dataAnalyze.manifest.module['분석'])

session.addModule("main", `
편의점_상품들 = @데이터_불러오기 편의점 데이터
편의점_상품들중 '상품ID'가 'CVS003'인 값 보여주기
편의점_상품들중 '가격'이 2000 이상인 것들 '재고' 순서로 정렬해서 보여주기
`)
await session.runModule('main')
