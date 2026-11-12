import { Chain } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import {
    ChainShape,
    ChainShapeBase,
    Fallback,
    UnionToIntersection,
} from '../common.ts'

export class ListCondition extends MatchCondition {
    public static methodName = 'list' as const

    constructor(public subchains: Chain<unknown, ChainShapeBase>[]) {
        super()
    }

    static creater<const PrevChain extends Chain<unknown, ChainShapeBase>>(
        chain: PrevChain,
    ): <
        const ParentType,
        const SubchainsType extends Chain<
            ChainShape<PrevChain>['Input'] extends unknown[]
                ? ChainShape<PrevChain>['Input'][number]
                : never,
            ChainShapeBase
        >[],
    >(
        subchains: SubchainsType,
    ) => Chain<
        ParentType,
        {
            Input: {
                [K in keyof SubchainsType]: ChainShape<
                    SubchainsType[K]
                >['Input']
            }
            Meta: unknown
            Select: UnionToIntersection<
                {
                    [K in keyof SubchainsType]: Fallback<
                        ChainShape<SubchainsType[K]>['Select'],
                        never
                    >
                }[number]
            >
        }
    > {
        return <
            const ParentType,
            const SubchainsType extends Chain<
                ChainShape<PrevChain>['Input'] extends unknown[]
                    ? ChainShape<PrevChain>['Input'][number]
                    : never,
                ChainShapeBase
            >[],
        >(
            subchains: SubchainsType,
        ) => {
            return chain.pipe<
                ParentType,
                {
                    Input: {
                        [K in keyof SubchainsType]: ChainShape<
                            SubchainsType[K]
                        >['Input']
                    }
                    Meta: unknown
                    Select: UnionToIntersection<
                        {
                            [K in keyof SubchainsType]: Fallback<
                                ChainShape<SubchainsType[K]>['Select'],
                                never
                            >
                        }[number]
                    >
                }
            >(new ListCondition(subchains))
        }
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const submatchers = requester.newArg(
            this.subchains.map((s) => s.compile()),
        )

        const cursor = requester.newVar()
        const i = requester.newVar()

        const currentMatcher = requester.newVar()
        const currentInput = requester.newVar()
        const matchResult = requester.newVar()
        const isSpacing = requester.newVar()

        const noLeftInput = requester.newVar('noLeftPattern')
        const noLeftPattern = requester.newVar('noLeftInput')

        const selectJar = requester.selectJar()

        return `
        let ${cursor} = 0;
        let ${i} = 0;

        let ${isSpacing} = -1

        while(${i} < ${submatchers}.length && ${cursor} < ${accessor}.length) {
            const ${currentMatcher} = ${submatchers}[${i}]
            const ${currentInput} = ${accessor}[${cursor}]

            if(${currentMatcher}.meta.spread) {
                ${isSpacing} = ${cursor}
                ${i}++
                continue
            }

            const ${matchResult} = ${currentMatcher}.func(${currentMatcher}.id, ${currentInput}, ${selectJar})

            if(${matchResult}) {
                if(${isSpacing} !== -1) {
                    ${submatchers}[${i} - 1].func(${submatchers}[${i} - 1].id, ${accessor}.slice(${isSpacing}, ${cursor}), ${selectJar})
                    ${isSpacing} = -1
                }

                ${cursor}++
                ${i}++

                continue
            }

            if(${isSpacing} !== -1) {
                ${cursor}++
                continue
            }

            return false
        }

        const ${noLeftInput} = ${cursor} === ${accessor}.length
        const ${noLeftPattern} = ${i} === ${submatchers}.length

        if(${noLeftInput} && !${noLeftPattern}) {
            if(${i} === (${submatchers}.length - 1) && ${submatchers}[${i}].meta.spread) {
                // 입력이 먼저 동났는데 패턴이 spacing 딸 것만 남음
                ${submatchers}[${i}].func(${submatchers}[${i}].id, [], ${selectJar})
            } else {
                // Spacing 말고도 남은 패턴이 있음
                return false
            }
        }

        if(!${noLeftInput} && ${noLeftPattern}) {
            if(${isSpacing} !== -1) {
                // 패턴이 먼저 동났는데 마지막 패턴이 spacing임
                ${submatchers}[${i} - 1].func(${submatchers}[${i} - 1].id, ${accessor}.slice(${isSpacing}), ${selectJar})
            } else {
                // 입력이 남았는데 spacing 따는 중이 아니였음
                return false
            }
        }
        `
    }
}
