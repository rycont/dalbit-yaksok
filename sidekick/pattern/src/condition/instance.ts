import { ChainShape, ClassType, UpdateShape } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import { Chain } from './index.ts'

export class InstanceCondition extends MatchCondition {
    public static methodName = 'instance' as const

    constructor(public classType: ClassType) {
        super()
    }

    static creater<C extends Chain>(chain: C) {
        return <InputClassType extends ClassType>(
            classType: InputClassType,
        ) => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: ChainShape<C>['Input'] &
                            InstanceType<InputClassType>
                    }
                >
            >(new InstanceCondition(classType))
        }
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const argName = requester.newArg(this.classType)

        const statement = `if(!(${accessor} instanceof ${argName})) {
    return false
}`

        return statement
    }
}
