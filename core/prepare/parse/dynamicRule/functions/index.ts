import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import { tokensToFFIDeclareRule } from './declare-rule/ffi-declare-rule.ts'
import { createFunctionInvokeRule } from './invoke-rule.ts'

import { getFunctionDeclareRanges } from '../../../../util/get-function-declare-ranges.ts'
import { tokensToYaksokDeclareRule } from './declare-rule/yaksok-declare-rule.ts'
import { tokensToEventDeclareRule } from './declare-rule/event-declare-rule.ts'
import { tokensToClassDeclareRule } from './declare-rule/class-declare-rule.ts'
import { tokensToMethodDeclareRule } from './declare-rule/method-declare-rule.ts'
import { tokensToMethodFFIDeclareRule } from './declare-rule/method-ffi-declare-rule.ts'

import { TOKEN_TYPE, type Token } from '../../../tokenize/token.ts'
import type { Rule } from '../../type.ts'
import { tokensToEventSubscribeRule } from './tokens-to-event-subscribe-rule.ts'

export function createLocalDynamicRules(
    tokens: Token[],
    functionDeclareRanges = getFunctionDeclareRanges(tokens),
): [Rule[][], Rule[][]] {
    const getTokensFromRange = getTokensFromRangeFactory(tokens)

    const yaksokHeaders = functionDeclareRanges.yaksok.map(getTokensFromRange)
    const ffiRanges = functionDeclareRanges.ffi.filter(
        ([start]) => !isMethodFFIHeaderRange(tokens, start),
    )
    const ffiHeaders = ffiRanges.map(getTokensFromRange)
    const classHeaders = functionDeclareRanges.class.map(getTokensFromRange)
    const eventHeaders = functionDeclareRanges.event.map(getTokensFromRange)
    const methodDeclarations = collectMethodDeclarations(tokens)
    const methodHeaders = methodDeclarations.map((d) => d.headerTokens)

    const invokingRules = [...yaksokHeaders, ...ffiHeaders, ...methodHeaders]
        .map(convertTokensToFunctionTemplate)
        .flatMap(createFunctionInvokeRule)
        .toSorted((a, b) => b.pattern.length - a.pattern.length)

    const eventSubscribeRules = eventHeaders.flatMap(tokensToEventSubscribeRule)

    const ffiDeclareRules = ffiHeaders.map(tokensToFFIDeclareRule)
    const yaksokDeclareRules = yaksokHeaders.map(tokensToYaksokDeclareRule)
    const methodDeclareRules = methodDeclarations.flatMap((d) =>
        d.kind === 'normal'
            ? tokensToMethodDeclareRule(
                  d.prefixTokens,
                  d.headerTokens,
                  d.receiverTypeNames,
              )
            : tokensToMethodFFIDeclareRule(
                  d.prefixTokens,
                  d.headerTokens,
                  d.receiverTypeNames,
              ),
    )
    const classDeclareRules = classHeaders.map(tokensToClassDeclareRule)
    const eventDeclareRules = eventHeaders.map(tokensToEventDeclareRule)

    const declareRules = [
        ...ffiDeclareRules,
        ...yaksokDeclareRules,
        ...methodDeclareRules,
        ...classDeclareRules,
        ...eventDeclareRules,
    ].toSorted((a, b) => b.pattern.length - a.pattern.length)

    return [[declareRules], [eventSubscribeRules, invokingRules]]
}

const getTokensFromRangeFactory =
    (tokens: Token[]) => (range: [number, number]) =>
        tokens.slice(range[0], range[1])

interface MethodDeclarationInfo {
    kind: 'normal' | 'ffi'
    prefixTokens: Token[]
    headerTokens: Token[]
    receiverTypeNames: string[]
}

function collectMethodDeclarations(tokens: Token[]): MethodDeclarationInfo[] {
    const declarations: MethodDeclarationInfo[] = []

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        if (token.type !== TOKEN_TYPE.IDENTIFIER || token.value !== '메소드') {
            continue
        }

        let cursor = i + 1
        while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
        if (tokens[cursor]?.type !== TOKEN_TYPE.OPENING_PARENTHESIS) continue

        cursor++
        const receiverTypeNames: string[] = []
        while (
            cursor < tokens.length &&
            tokens[cursor].type !== TOKEN_TYPE.CLOSING_PARENTHESIS
        ) {
            if (tokens[cursor].type === TOKEN_TYPE.IDENTIFIER) {
                receiverTypeNames.push(tokens[cursor].value)
            }
            cursor++
        }
        if (tokens[cursor]?.type !== TOKEN_TYPE.CLOSING_PARENTHESIS) continue

        cursor++
        while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
        if (tokens[cursor]?.type !== TOKEN_TYPE.COMMA) continue
        const commaIndex = cursor

        let headerStart = commaIndex + 1
        while (tokens[headerStart]?.type === TOKEN_TYPE.SPACE) headerStart++

        let kind: MethodDeclarationInfo['kind'] = 'normal'
        if (
            tokens[headerStart]?.type === TOKEN_TYPE.IDENTIFIER &&
            tokens[headerStart].value === '번역'
        ) {
            let ffiCursor = headerStart + 1
            while (tokens[ffiCursor]?.type === TOKEN_TYPE.SPACE) ffiCursor++
            if (tokens[ffiCursor]?.type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
                continue
            }

            ffiCursor++
            while (
                ffiCursor < tokens.length &&
                tokens[ffiCursor].type !== TOKEN_TYPE.CLOSING_PARENTHESIS
            ) {
                ffiCursor++
            }
            if (tokens[ffiCursor]?.type !== TOKEN_TYPE.CLOSING_PARENTHESIS) {
                continue
            }

            ffiCursor++
            while (tokens[ffiCursor]?.type === TOKEN_TYPE.SPACE) ffiCursor++
            if (tokens[ffiCursor]?.type !== TOKEN_TYPE.COMMA) {
                continue
            }

            headerStart = ffiCursor + 1
            while (tokens[headerStart]?.type === TOKEN_TYPE.SPACE) headerStart++
            kind = 'ffi'
        }

        const newLineRelative = tokens
            .slice(headerStart)
            .findIndex((t) => t.type === TOKEN_TYPE.NEW_LINE)
        if (newLineRelative === -1) continue
        const headerEnd = headerStart + newLineRelative

        declarations.push({
            kind,
            prefixTokens: tokens.slice(i, headerStart),
            headerTokens: tokens.slice(headerStart, headerEnd),
            receiverTypeNames,
        })

        i = headerEnd
    }

    return declarations
}

function isMethodFFIHeaderRange(tokens: Token[], headerStart: number): boolean {
    let cursor = headerStart - 1
    while (cursor >= 0 && tokens[cursor].type !== TOKEN_TYPE.NEW_LINE) {
        if (
            tokens[cursor].type === TOKEN_TYPE.IDENTIFIER &&
            tokens[cursor].value === '메소드'
        ) {
            return true
        }
        cursor--
    }

    return false
}
