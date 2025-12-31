import { YaksokSession } from '@dalbit-yaksok/core'
import { DataAnalyze } from '@dalbit-yaksok/dala-analyze'

const session = new YaksokSession()

const dataAnalyze = new DataAnalyze()
await session.extend(dataAnalyze)
await session.setBaseContext(dataAnalyze.manifest.module!['분석'])

session.addModule("main", `
편의점_상품들 = @데이터_불러오기 편의점 데이터

편의점_상품들중 '상품ID'가 'CVS003'인 값들 보여주기
편의점_상품들중 '가격'이 2000 이상인 것들 '재고' 순서로 정렬해서 앞에서 2개 보여주기
편의점_상품들중 '상품명'에 '지'가 포함된 값 에서 '가격' 가져와서 보여주기
편의점_상품들중 '재고'가 30 미만인 것들 보여주기

간편식사 = 편의점_상품들에서 '카테고리'에 '간편식사'가 포함된 것들
간편식사_상품들 = 간편식사에서 ['상품ID', '상품명', '가격'] 가져오기
간편한_ID들 = 간편식사_상품들에서 '상품ID' 가져오기
간편한_ID들 보여주기
`)
await session.runModule('main')
