# Slack TA Candadate Integration Project

## To run the project
* `npm ci`
* populate `.env` with the required fields:
  * `SLACK_BOT_TOKEN`
  * `SLACK_SIGNING_SECRET`
  * `SLACK_APP_TOKEN`
* ensure that you have your AWS CLI setup: https://docs.aws.amazon.com/polly/latest/dg/setup-aws-cli.html
* if this is your first time using the AWS CDK on your AWS Account, you need to bootstrap it: `npm run cdk bootstrap`
* verify the tests: `npm test`
* deploy the solution: `npm run cdk deploy`

## Integrate the output to your Slack App
* node the base URL supplied as the `restapiEndpoint` output by the `deploy` command.
* supply your Slack App with the base URL + /slack/interactive

## Integrate the output to your Github repo
* supply your github repo webhook with the base URL + github/hooks
* enable all events

## Useful CDK commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
