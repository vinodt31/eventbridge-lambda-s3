import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class EventbridgeLambdaS3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    const bucket = new s3.Bucket(this, 'StateListBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Auto-delete during stack removal
    });

    // Lambda function
    const lambdaFunction = new lambdaNodejs.NodejsFunction(this, 'StateListFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/stateListLambda.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function permissions to write to the S3 bucket
    bucket.grantWrite(lambdaFunction);

    // OR explicitly add policy for debugging (if needed)
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`], // Allow write access to all objects in the bucket
    }));

    // EventBridge rule to trigger Lambda every 10 hours
    new events.Rule(this, 'HourlyTrigger', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(lambdaFunction)],
    });

    // Create second Lambda function
    const lambdaFunctionNew = new lambdaNodejs.NodejsFunction(this, 'StateListFunctionNew', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/stateListLambdaNew.ts'), // Use different logic here if needed
      handler: 'handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the second Lambda function permissions to write to the S3 bucket
    bucket.grantWrite(lambdaFunctionNew);

    // Add debugging policy
    lambdaFunctionNew.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`],
    }));

    // EventBridge rule for the second Lambda
    new events.Rule(this, 'HourlyTriggerNew', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)), // Different schedule if needed
      targets: [new targets.LambdaFunction(lambdaFunctionNew)],
    });
  }
}
