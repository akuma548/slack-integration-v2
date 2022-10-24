import { StackProps } from 'aws-cdk-lib';

export interface ISlackIntegrationV2StackProps extends StackProps {
    // readonly slackWebhookURL: string;
    readonly slackBotToken: string;
    readonly slackSigningSecret: string;
    readonly slackAppToken: string;
};
