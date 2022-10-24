import { Block, KnownBlock } from '@slack/bolt';
import { IRepoMessage } from './slackMessage/iRepoMessage';
import { genericSlackMessage } from './slackMessage/generic';
import { pullRequestSlackMessage } from './slackMessage/pullrequest';
import { pushSlackMessage } from './slackMessage/push';

export class SlackMessageFactory {
    private constructor() {}
    static create(repoMessage: IRepoMessage): Array<Block | KnownBlock> {
        let generator: (input: IRepoMessage) => Array<Block | KnownBlock> = genericSlackMessage;
        switch(repoMessage.type) {
            case 'push':
                generator = pushSlackMessage;
                break;
            case 'pull':
                generator = pullRequestSlackMessage;
                break;
            default:
                generator = genericSlackMessage;
        }
        const slackMessage = generator(repoMessage);
        return slackMessage;
    }
};
