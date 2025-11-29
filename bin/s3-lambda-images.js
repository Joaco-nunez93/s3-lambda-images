const cdk = require('aws-cdk-lib');
const { S3LambdaImagesStack } = require('../lib/s3-lambda-images-stack.js');

const app = new cdk.App();

new S3LambdaImagesStack(app, 'S3LambdaImagesStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
