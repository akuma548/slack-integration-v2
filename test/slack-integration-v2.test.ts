import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ISlackIntegrationV2StackProps } from '../lib/iSlackIntegrationV2StackProps';
import * as SlackIntegrationV2 from '../lib/slack-integration-v2-stack';

test('All Components Created', () => {
    const app = new cdk.App();
    // WHEN
    const stackProps: ISlackIntegrationV2StackProps = {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },
        slackAppToken: 'slackAppToken',
        slackBotToken: 'slackBotToken',
        slackSigningSecret: 'slackSigningSecret',
    }
    const stack = new SlackIntegrationV2.SlackIntegrationV2Stack(app, 'MyTestStack', stackProps);
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'formattedWebhook',
        TopicName: 'formattedWebhook',
    });
    template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'apigateway.amazonaws.com'
                    }
                }
            ],
        },
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
            Statement: [
                {
                    Action: 'sns:Publish',
                    Effect: 'Allow',
                },
                {
                    Action: 'sqs:SendMessage',
                    Effect: 'Allow',
                }
            ],
        }
    });
    template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'lambda.amazonaws.com'
                    }
                }
            ],
        },
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
            Statement: [
                {
                    Action: 'sns:Publish',
                    Effect: 'Allow',
                },
                {
                    Action: 'sqs:SendMessage',
                    Effect: 'Allow',
                },
            ],
        },
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: 'slack-integration-logs-apigw',
    });
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'slack-integration',
    });
    template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'apigateway.amazonaws.com',
                    }
                }
            ],
        },
    });
    template.hasResourceProperties('AWS::ApiGateway::Account', {});
    template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
    });
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'github',
    });
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'hooks',
    });
    template.resourcePropertiesCountIs('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
    }, 2);
    template.resourcePropertiesCountIs('AWS::SQS::Queue', {}, 3);
    template.resourcePropertiesCountIs('AWS::Lambda::Function', {
        Handler: 'index.handler',
        MemorySize: 256,
        Runtime: 'nodejs16.x',
        Timeout: 5
    }, 3);
    template.resourcePropertiesCountIs('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'sns.amazonaws.com',
    }, 1);
    template.resourcePropertiesCountIs('AWS::SNS::Subscription', {
        Protocol: 'lambda',
    }, 1);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
            {
                AttributeName: 'id',
                KeyType: 'HASH'
            },
        ],
        AttributeDefinitions: [
            {
                AttributeName: 'id',
                AttributeType: 'S',
            },
        ],
        BillingMode: 'PAY_PER_REQUEST',
    });
});
