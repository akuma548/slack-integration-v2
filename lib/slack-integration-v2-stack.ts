import { 
  Stack, 
  aws_lambda_nodejs, 
  aws_lambda as lambda, 
  Duration, 
  aws_apigateway as apigateway, 
  aws_sns as sns, 
  aws_sns_subscriptions as sns_subscriptions, 
  aws_logs as logs, 
  aws_iam as iam,  
  RemovalPolicy,
  aws_dynamodb as dynamo,
} from 'aws-cdk-lib';
import { spawnSync } from 'child_process';
import { Construct } from 'constructs';
import * as path from 'path';

import { ISlackIntegrationV2StackProps } from './iSlackIntegrationV2StackProps';

export class SlackIntegrationV2Stack extends Stack {
  constructor(scope: Construct, id: string, props: ISlackIntegrationV2StackProps) {
    super(scope, id, props);

    // dynamo db to catch the interactive responses from Slack
    const db = new dynamo.Table(this, 'dynamo-table', {
      partitionKey: {
        name: 'id',
        type: dynamo.AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });

    // event for processing the transformed message
    const formattedWebhookEvent = new sns.Topic(this, 'formatted-webhook-topic', {
      topicName: 'formattedWebhook',
      displayName: 'formattedWebhook',
    });

    // allow api gateway to publish to sns

    const apiGwRole = new iam.Role(this, 'apigw-sns-role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    
    // githubWebhookEvent.grantPublish(apiGwRole);

    // allow lambda to publish to sns

    const lambdaTransformRole = new iam.Role(this, 'lambda-sns-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    formattedWebhookEvent.grantPublish(lambdaTransformRole);

    // allow lambda to write logs

    const awsLambdaBasicExecutionManagedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole');
    
    lambdaTransformRole.addManagedPolicy(awsLambdaBasicExecutionManagedPolicy);
    
    const lambdaSlackNotifierRole = new iam.Role(this, 'notifier-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaSlackNotifierRole.addManagedPolicy(awsLambdaBasicExecutionManagedPolicy);
    
    // allow lambda to write to dynamodb
    const lambdaDynamodbRole = new iam.Role(this, 'lambda-dynamodb-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    db.grantWriteData(lambdaDynamodbRole);
    lambdaDynamodbRole.addManagedPolicy(awsLambdaBasicExecutionManagedPolicy);

    // lambda to insert into dynamodb
    const lambdaDynamoInserterBasePath = path.join(__dirname, '..', 'resources', 'dynamoinserter');
    spawnSync('npm', ['ci'], {
      cwd: path.join(lambdaDynamoInserterBasePath, 'baseLayer', 'nodejs'),
      env: process.env,
    });
    const lambdaDynamoInserterLayer = new lambda.LayerVersion(this, 'dynamoinserter-layer', {
      code: lambda.Code.fromAsset(path.join(lambdaDynamoInserterBasePath, 'baseLayer')),
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const lambdaDynamoInserter = new aws_lambda_nodejs.NodejsFunction(this, 'dynamodb-inserter', {
      memorySize: 256,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(lambdaDynamoInserterBasePath, 'index.ts'),
      bundling: {
        minify: false,
        externalModules: [
          'aws-sdk',
          'uuid',
        ],
      },
      environment: {
        TABLE_NAME: db.tableName,
      },
      role: lambdaDynamodbRole,
      deadLetterQueueEnabled: true,
      layers: [
        lambdaDynamoInserterLayer,
      ],
    });

    // lambda to parse and transform the incoming message
    const lambdaTransformerBasePath = path.join(__dirname, '..', 'resources', 'githubparser');
    spawnSync('npm', ['ci'], {
      cwd: path.join(lambdaTransformerBasePath, 'baseLayer', 'nodejs'),
      env: process.env,
    });
    const lambdaTransformerLayer = new lambda.LayerVersion(this, 'transformer-layer', {
      code: lambda.Code.fromAsset(path.join(lambdaTransformerBasePath, 'baseLayer')),
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const lambdaTransformer = new aws_lambda_nodejs.NodejsFunction(this, 'message-parser', {
      memorySize: 256,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(lambdaTransformerBasePath, 'index.ts'),
      bundling: {
        minify: false,
        externalModules: [
          'aws-sdk',
        ],
      },
      environment: {
        PUBLISH_TOPIC_ARN: formattedWebhookEvent.topicArn,
      },
      role: lambdaTransformRole,
      deadLetterQueueEnabled: true,
      layers: [
        lambdaTransformerLayer,
      ],
    });

    // create the lambda api

    // allow api gateway to log stuff

    const apiGwLogGroup = new logs.LogGroup(this, 'access-logs', {
      logGroupName: 'slack-integration-logs-apigw',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiGwLogGroupDestination = new apigateway.LogGroupLogDestination(apiGwLogGroup);

    const restAPI = new apigateway.LambdaRestApi(this, 'rest-api', {
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        accessLogDestination: apiGwLogGroupDestination,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        tracingEnabled: true,
      },
      proxy: false,
      cloudWatchRole: true,
      restApiName: 'slack-integration',
      handler: lambdaTransformer,
    });

    lambdaTransformer.addPermission('ApiGWPermission', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: restAPI.arnForExecuteApi(),
    });

    const githubResource = restAPI.root.addResource('github');
    const hookResource = githubResource.addResource('hooks');
    const hookMethod = hookResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaTransformer));
    hookResource.addCorsPreflight({
      allowOrigins: ['*'],
    });

    const slackResource = restAPI.root.addResource('slack');
    const interactiveResource = slackResource.addResource('interactive');
    const interactiveMethod = interactiveResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaDynamoInserter));
    interactiveResource.addCorsPreflight({
      allowOrigins: ['*'],
    });
    
    // subscribe to the incoming message
    // githubWebhookEvent.addSubscription(new sns_subscriptions.LambdaSubscription(lambdaTransformer));

    // lambda to parse and transform the incoming message
    const lambdaSlackNotifierBasePath = path.join(__dirname, '..', 'resources', 'slacknotifier');
    spawnSync('npm', ['ci'], {
      cwd: path.join(lambdaSlackNotifierBasePath, 'baseLayer', 'nodejs'),
      env: process.env,
    });
    const lambdaSlackNotifierLayer = new lambda.LayerVersion(this, 'slacknotifier-layer', {
      code: lambda.Code.fromAsset(path.join(lambdaSlackNotifierBasePath, 'baseLayer')),
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const lambdaSlackNotifier = new aws_lambda_nodejs.NodejsFunction(this, 'slack-notifier', {
      memorySize: 256,
      timeout: Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'resources', 'slacknotifier', 'index.ts'),
      bundling: {
        minify: false,
        externalModules: [
          '@slack/bolt',
          'aws-lambda',
        ],
      },
      environment: {
        SLACK_BOT_TOKEN: props.slackBotToken,
        SLACK_SIGNING_SECRET: props.slackSigningSecret,
        SLACK_APP_TOKEN: props.slackAppToken,
      },
      role: lambdaSlackNotifierRole,
      deadLetterQueueEnabled: true,
      layers: [
        lambdaSlackNotifierLayer,
      ],
    });
    
    // subscribe to the incoming message
    formattedWebhookEvent.addSubscription(new sns_subscriptions.LambdaSubscription(lambdaSlackNotifier));
  }
}
