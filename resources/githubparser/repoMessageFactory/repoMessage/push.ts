import { IRepoMessage } from './iRepoMessage';

export function pushRepoMessage(pushWebookPayload: { repository: { name: string; html_url: string; }; pusher: { name: string; }; compare: string; }): IRepoMessage {
    const repoMessage: IRepoMessage = {
        repositoryName: pushWebookPayload.repository.name,
        repositoryUrl: pushWebookPayload.repository.html_url,
        user: pushWebookPayload.pusher.name,
        compareUrl: pushWebookPayload.compare,
        type: 'push',
    };
    return repoMessage;
};
