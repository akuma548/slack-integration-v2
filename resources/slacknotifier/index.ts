import { Context, SNSEvent } from 'aws-lambda';
import { App, Block, KnownBlock } from '@slack/bolt';
import { SlackMessageFactory } from './slackMessageFactory/slackMessageFactory';
import { IRepoMessage } from './slackMessageFactory/slackMessage/iRepoMessage';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
});

async function sendToSlack(repoMessage: IRepoMessage): Promise<void> {
    const { channels } = await app.client.conversations.list();
    const channel = channels?.filter(x => x.name === repoMessage.repositoryName)[0];
    if(channel && channel.id) {
        const blocks: Array<Block | KnownBlock> = SlackMessageFactory.create(repoMessage);
        await app.client.chat.postMessage({
            channel: channel.id,
            text: JSON.stringify(repoMessage),
            blocks,
        });
    }
}

exports.handler = async function (event: SNSEvent, context: Context): Promise<void> {
    try {
        const promises = event.Records.map((record) => {
            const {
                Sns: {
                    Message: stringifiedMessage,
                },
            } = record;
            const message: IRepoMessage = JSON.parse(stringifiedMessage);
            console.log(message);
            return sendToSlack(message);
        });
        await Promise.all(promises);
    } catch (uncaughtError) {
        console.error(uncaughtError);
        throw uncaughtError;
    }
    return;
};