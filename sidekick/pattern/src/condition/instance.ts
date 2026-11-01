import { ChainShapeBase } from '@dalbit-yaksok/pattern'
import { ChainShape, ClassType, UpdateShape } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import { Chain } from './index.ts'

export class InstanceCondition extends MatchCondition {
    public static methodName = 'instance' as const

    constructor(public classType: ClassType) {
        super()
    }

    static creater<C extends Chain<unknown, ChainShapeBase>>(
        chain: C,
    ): <const ParentType, InputClassType extends ClassType>(
        classType: InputClassType,
    ) => Chain<
        ParentType,
        UpdateShape<
            ChainShape<C>,
            {
                Input: ChainShape<C>['Input'] & InstanceType<InputClassType>
                Meta: ChainShape<C>['Meta'] & {
                    classShape: InputClassType
                }
            }
        >
    > {
        return <const ParentType, InputClassType extends ClassType>(
            classType: InputClassType,
        ) => {
            return chain.pipe<
                ParentType,
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: ChainShape<C>['Input'] &
                            InstanceType<InputClassType>
                        Meta: ChainShape<C>['Meta'] & {
                            classShape: InputClassType
                        }
                    }
                >
            >(new InstanceCondition(classType), {
                classShape: classType,
            })
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
