import { IRepoMessage } from './iRepoMessage';

export function genericRepoMessage(genericWebookPayload: {repository: { name: string; html_url: string; }; sender: {login:string;};}): IRepoMessage {
    const repoMessage: IRepoMessage = {
        repositoryName: genericWebookPayload.repository.name,
        repositoryUrl: genericWebookPayload.repository.html_url,
        user: genericWebookPayload.sender.login,
        type: 'generic'
    };
    return repoMessage;
};
