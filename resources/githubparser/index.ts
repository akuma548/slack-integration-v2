import { Context, APIGatewayEvent } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { RepoMessageFactory } from './repoMessageFactory/repoMessageFactory';

exports.handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        const sns = new SNS();
        if(event.body){
            const message = JSON.parse(event.body);
            const repoMessage = RepoMessageFactory.create(message);
            const publishParams = {
                Message: JSON.stringify(repoMessage),
                TopicArn: process.env.PUBLISH_TOPIC_ARN,
            };
            await sns.publish(publishParams).promise();
        }
        return {
            statusCode: 202,
            body: 'success',
        }
    } catch (err) {
        console.error(err);
        let body = 'unknown error';
        if(err instanceof Error) {
            body = err.message;
        } else if (typeof(err) ===  'string') {
            body = err;
        }
        return {
            statusCode: 500,
            body
        };
    }
};