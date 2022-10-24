export type IRepoMessageType = 'push' | 'pull' | 'generic';

export interface IRepoMessage {
    readonly repositoryName: string;
    readonly repositoryUrl: string;
    readonly user: string;
    readonly action?: string;
    readonly pullRequestUrl?: string;
    readonly compareUrl?: string;
    readonly type: IRepoMessageType;
};
