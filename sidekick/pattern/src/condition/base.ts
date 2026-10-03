export interface GlobalRequester {
    newArg(content: unknown): string
    newVar(): string
    selectJar(): string
}

export abstract class MatchCondition {
    public createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        void accessor
        void requester

        throw new Error('Not implemented')
    }
}
