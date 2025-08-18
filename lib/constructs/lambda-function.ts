import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface MyLambdaProps {
  lambdaName: string;
  runtime: lambda.Runtime;
  environment?: Record<string,string>;
  handler: string;
  code: lambda.Code;
  memorySize?: number;
  timeout?: cdk.Duration;

}

export class BackendLambda extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: MyLambdaProps) {
    super(scope, id);
  
  this.function = new lambda.Function(this, props.lambdaName, {
    runtime : props.runtime,
    environment: props.environment,
    handler: props.handler,
    code: props.code,
    memorySize: props.memorySize ?? 128,
    timeout: props.timeout ?? cdk.Duration.seconds(10),

  })
}
}
