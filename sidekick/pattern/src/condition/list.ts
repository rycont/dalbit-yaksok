import { Chain } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { ChainShape, UpdateShape } from '../common.ts'

export class ListCondition extends MatchCondition {
    public static methodName = 'list' as const

    constructor(public subchains: Chain[]) {
        super()
    }

    static creater<C extends Chain>(chain: C) {
        return <const Subchains extends Chain[]>(subchains: Subchains) => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Select: {
                            [K in keyof Subchains]: ChainShape<
                                Subchains[K]
                            >['Input']
                        }
                    }
                >
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

        if(${i} !== ${submatchers}.length && !(${isSpacing} === -1 && ${i} === ${submatchers}.length - 1)) {
            return false
        }

        if(${isSpacing} !== -1) {
            ${submatchers}[${i} - 1].func(${submatchers}[${i} - 1].id, ${accessor}.slice(${isSpacing}), ${selectJar})
        } else if(${cursor} !== ${accessor}.length) {
            return false
        }
        `
    }
}
