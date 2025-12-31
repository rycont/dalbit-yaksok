# Requirements Document

## Introduction

한국어 자연어 문법을 사용하여 데이터 분석을 수행할 수 있는 라이브러리입니다. 사용자가 한국어 문장처럼 자연스럽게 데이터 필터링, 정렬, 집계 등의 작업을 체이닝 방식으로 수행할 수 있도록 합니다.

## Glossary

- **Analysis_Library**: 한국어 자연어 문법을 사용한 데이터 분석 라이브러리
- **Data_Chain**: 체이닝 방식으로 연결되는 데이터 처리 함수들의 연속
- **Filter_Function**: 데이터를 조건에 따라 필터링하는 함수
- **Sort_Function**: 데이터를 특정 기준으로 정렬하는 함수
- **Aggregate_Function**: 데이터를 집계하여 결과를 도출하는 함수

## Requirements

### Requirement 1

**User Story:** 개발자로서, 한국어 자연어 문법을 사용하여 데이터를 필터링하고 싶습니다. 그래야 코드가 더 직관적이고 이해하기 쉬워집니다.

#### Acceptance Criteria

1. WHEN 사용자가 "데이터중 '필드명'이/가 값보다 큰 것" 형태로 호출하면, THE Analysis_Library SHALL 해당 조건을 만족하는 데이터만 반환한다
2. WHEN 사용자가 "데이터중 '필드명'이/가 값보다 작은 것" 형태로 호출하면, THE Analysis_Library SHALL 해당 조건을 만족하는 데이터만 반환한다
3. WHEN 사용자가 "데이터중 '필드명'이/가 값인 것" 형태로 호출하면, THE Analysis_Library SHALL 정확히 일치하는 데이터만 반환한다
4. WHEN 사용자가 "데이터중 '필드명'에 값이/가 들어가 있는 것" 형태로 호출하면, THE Analysis_Library SHALL 해당 값을 포함하는 데이터만 반환한다

### Requirement 2

**User Story:** 개발자로서, 필터링된 데이터를 정렬하고 싶습니다. 그래야 원하는 순서로 데이터를 확인할 수 있습니다.

#### Acceptance Criteria

1. WHEN 사용자가 "데이터를 '필드명'로/으로 정렬한 것" 형태로 호출하면, THE Analysis_Library SHALL 해당 필드를 기준으로 오름차순 정렬된 데이터를 반환한다
2. WHEN 사용자가 정렬 함수를 호출하면, THE Analysis_Library SHALL 이전 체인의 결과를 입력으로 받아 처리한다

### Requirement 3

**User Story:** 개발자로서, 체이닝 방식으로 여러 작업을 연결하고 싶습니다. 그래야 복잡한 데이터 분석을 자연스럽게 표현할 수 있습니다.

#### Acceptance Criteria

1. WHEN 사용자가 필터링 함수를 호출하면, THE Analysis_Library SHALL 체이닝 가능한 객체를 반환한다
2. WHEN 사용자가 정렬 함수를 호출하면, THE Analysis_Library SHALL 체이닝 가능한 객체를 반환한다
3. WHEN 사용자가 여러 함수를 연속으로 호출하면, THE Analysis_Library SHALL 각 단계의 결과를 다음 단계의 입력으로 전달한다

### Requirement 4

**User Story:** 개발자로서, 집계 함수를 사용하여 최종 결과를 얻고 싶습니다. 그래야 분석의 목적에 맞는 결과를 도출할 수 있습니다.

#### Acceptance Criteria

1. WHEN 사용자가 "가장 많이 나온 '필드명'" 형태로 호출하면, THE Analysis_Library SHALL 해당 필드에서 가장 빈도가 높은 값을 반환한다
2. WHEN 사용자가 집계 함수를 호출하면, THE Analysis_Library SHALL 체인의 최종 결과를 반환한다

### Requirement 5

**User Story:** 개발자로서, 한국어 조사 변화를 자동으로 처리하고 싶습니다. 그래야 자연스러운 한국어 문법을 사용할 수 있습니다.

#### Acceptance Criteria

1. WHEN 사용자가 받침이 있는 단어 뒤에 조사를 사용하면, THE Analysis_Library SHALL 적절한 조사 형태를 인식한다
2. WHEN 사용자가 받침이 없는 단어 뒤에 조사를 사용하면, THE Analysis_Library SHALL 적절한 조사 형태를 인식한다
3. THE Analysis_Library SHALL 이/가, 을/를, 로/으로 조사 변화를 자동으로 처리한다