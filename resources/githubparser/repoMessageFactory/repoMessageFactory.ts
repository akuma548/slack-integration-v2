import { genericRepoMessage } from './repoMessage/generic';
import { IRepoMessage } from './repoMessage/iRepoMessage';
import { pullRequestRepoMessage } from './repoMessage/pullrequest';
import { pushRepoMessage } from './repoMessage/push';

export class RepoMessageFactory {
    constructor() {
        throw new Error('do not construct me');
    }
    static create(webhookPayload: {pusher?: {}, pull_request?: {}} = {}): IRepoMessage {
        let generator: (payload:any) => IRepoMessage = genericRepoMessage;
        if(webhookPayload.pusher) {
            generator = pushRepoMessage;
        } else if(webhookPayload.pull_request) {
            generator = pullRequestRepoMessage;
        }
        const repoMessage = generator(webhookPayload);
        return repoMessage;
    }
}
