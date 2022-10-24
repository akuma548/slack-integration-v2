import { Block, KnownBlock } from '@slack/bolt';
import { IRepoMessage } from './iRepoMessage';

export function pullRequestSlackMessage(pullRequestRepoMessage: IRepoMessage): Array<Block | KnownBlock> {
    const rightNow = new Date();
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:construction:  Pull Request ${pullRequestRepoMessage.action}!  :construction:`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${rightNow.toLocaleString()}*  |  by ${pullRequestRepoMessage.user}`,
            },
            accessory: {
                type: 'button',
                    text: {
                        type: 'plain_text',
                        text: ':mag_right:  Check It Out!  :mag:',
                        emoji: true,
                    },
                    action_id: 'view_button',
                    style: 'primary',
                    url: pullRequestRepoMessage.pullRequestUrl
            }
        },
    ]
};
