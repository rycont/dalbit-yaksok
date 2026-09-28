export interface GlobalRequester {
    newArg(content: unknown): string
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

    public select() {}

    public toCode(accessor: string, requester: GlobalRequester): string {
        return this.createStatement(accessor, requester) + '\n\n'
    }
}
