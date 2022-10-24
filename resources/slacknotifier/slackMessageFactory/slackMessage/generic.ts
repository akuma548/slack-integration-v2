import { Block, KnownBlock } from '@slack/bolt';
import { IRepoMessage } from './iRepoMessage';

export function genericSlackMessage(genericRepoMessage: IRepoMessage): Array<Block | KnownBlock> {
    const rightNow = new Date();
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:construction:  Something's going on in the ${genericRepoMessage.repositoryName} repository  :construction:`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${rightNow.toLocaleString()}*  |  by ${genericRepoMessage.user}`,
            },
            accessory: {
                type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'View',
                        emoji: true,
                    },
                    action_id: 'view_button',
                    style: 'primary',
                    url: genericRepoMessage.repositoryUrl
            }
        },
    ]
};
