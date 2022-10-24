import { Context, APIGatewayEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import querystring from 'querystring';
import { v4 } from 'uuid';

async function sendToDynamo(payload: {}) {
    const dynamodb = new DynamoDB.DocumentClient();
    const params: DynamoDB.DocumentClient.PutItemInput = {
        Item: {
            id: v4(),
            ...payload
        },
        TableName: process.env.TABLE_NAME!,
    };
    await dynamodb.put(params).promise();
}

exports.handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        if (event.body) {
            const qsBody = querystring.parse(event.body);
            let payloads: Array<string> = [];
            let dynamoPromises = [];
            if (qsBody.payload) {
                // normalize to an array
                payloads = payloads.concat(qsBody.payload);
            }
            dynamoPromises = payloads.map((payload: string) => {
                const parsedPayload = JSON.parse(payload);
                return sendToDynamo(parsedPayload);
            });
            await Promise.all(dynamoPromises);
        }
        return {
            statusCode: 202,
            body: 'success',
        };
    } catch (err) {
        console.error(err);
        let body = 'unknown error';
        if (err instanceof Error) {
            body = err.message;
        } else if (typeof (err) === 'string') {
            body = err;
        }
        return {
            statusCode: 500,
            body
        };
    }
};