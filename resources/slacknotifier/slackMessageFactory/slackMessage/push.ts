import { Block, KnownBlock } from '@slack/bolt';
import { IRepoMessage } from './iRepoMessage';

export function pushSlackMessage(pushRepoMessage: IRepoMessage): Array<Block | KnownBlock> {
    const rightNow = new Date();
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:construction:  Push INC!  :construction:`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${rightNow.toLocaleString()}*  |  by ${pushRepoMessage.user}`,
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
                    url: pushRepoMessage.compareUrl
            }
        },
    ]
};
