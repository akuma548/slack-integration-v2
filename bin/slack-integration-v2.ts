#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';
import { SlackIntegrationV2Stack } from '../lib/slack-integration-v2-stack';

config();

if(!process.env.SLACK_APP_TOKEN) {
  throw new Error('missing required env var SLACK_APP_TOKEN');
}
if(!process.env.SLACK_BOT_TOKEN) {
  throw new Error('missing required env var SLACK_BOT_TOKEN');
}
if(!process.env.SLACK_SIGNING_SECRET) {
  throw new Error('missing required env var SLACK_SIGNING_SECRET');
}

const app = new cdk.App();
new SlackIntegrationV2Stack(app, 'SlackIntegrationV2Stack', {
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    slackAppToken: process.env.SLACK_APP_TOKEN,
    slackBotToken: process.env.SLACK_BOT_TOKEN,
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
});
