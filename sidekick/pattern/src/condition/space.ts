import { MatchCondition } from './base.ts'

export class SpaceCondition extends MatchCondition {
    public static methodName = 'space' as const

    public override createStatement(): string {
        return ''
    }
}
