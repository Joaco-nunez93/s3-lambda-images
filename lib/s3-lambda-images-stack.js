const cdk = require('aws-cdk-lib');
const { Stack, Duration, RemovalPolicy } = cdk;
const s3 = require('aws-cdk-lib/aws-s3');
const lambda = require('aws-cdk-lib/aws-lambda');
const s3n = require('aws-cdk-lib/aws-s3-notifications');
const path = require('path');

class S3LambdaImagesStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 1) Buckets S3
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const destinationBucket = new s3.Bucket(this, 'DestinationBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2) Lambda Layer con Sharp
    const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../layers/sharp')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Layer con Sharp para redimensionar imágenes',
    });

    // 3) Función Lambda 
    const resizeFn = new lambda.Function(this, 'ResizeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda')
      ),
      timeout: Duration.seconds(30),
      memorySize: 1024,
      layers: [sharpLayer],
      environment: {
        DESTINATION_BUCKET: destinationBucket.bucketName,
      },
    });

    // 4) Permisos S3 (IAM policies sobre ese rol)
    sourceBucket.grantRead(resizeFn);
    destinationBucket.grantWrite(resizeFn);

    // 5) Disparador de evento S3 -> Lambda
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(resizeFn),
    );
  }
}

module.exports = { S3LambdaImagesStack };
