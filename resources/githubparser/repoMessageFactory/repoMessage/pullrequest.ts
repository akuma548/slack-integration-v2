import { IRepoMessage } from './iRepoMessage';

export function pullRequestRepoMessage(pullRequestWebookPayload: { repository: { name: string; html_url: string; }; action: string; sender: { login: string; }; pull_request: { url: string; }}): IRepoMessage {
    const repoMessage: IRepoMessage = {
        repositoryName: pullRequestWebookPayload.repository.name,
        repositoryUrl: pullRequestWebookPayload.repository.html_url,
        action: pullRequestWebookPayload.action,
        user: pullRequestWebookPayload.sender.login,
        pullRequestUrl: pullRequestWebookPayload.pull_request.url,
        type: 'pull',
    };
    return repoMessage;
};
