import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { BackendDynamoTable } from "./constructs/dyanamodb-table";
import { BackendSecret } from "./constructs/secrets-manager";
import { BackendLambda } from "./constructs/lambda-function";
import { BackendApi } from "./constructs/api-gateway";
import * as path from "path";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import * as logs from "./constructs/cloudwatch-log-group"
import * as cwlogs from "aws-cdk-lib/aws-logs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly cfSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const counterTable = new BackendDynamoTable(this, "CounterTable", {
      tableName: "visitor-counter",
      partitionKey: "id",
    });

    // CloudFront Secret
    const cfSecret = new BackendSecret(this, "CloudFrontSecret", {
      secretName: "cf-secret",
      secretKey: "x-cf-secret",
    });

    // Visit Counter Lambda
    const counterLambda = new BackendLambda(this, "VisitCounterLambda", {
      lambdaName: "visit-counter",
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/counter")),
      environment: {
        TABLE_NAME: counterTable.table.tableName,
      },
    });

    // Give Counter Lambda permissions to DynamoDB
    counterTable.table.grantReadWriteData(counterLambda.function);

    const counterLambdaLogs  = new logs.LogGroup(this, "CounterLambdaLogs", {
      logGroupName: `/aws/lambda/counter-lambda`,
      retention: cwlogs.RetentionDays.ONE_WEEK
    })

    // Authorizer Lambda
    const authorizerLambda = new BackendLambda(this, "AuthorizerLambda", {
      lambdaName: "api-authorizer",
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/authorizer")),
      environment: {
        SECRET_NAME: cfSecret.secret.secretName,
      },
    });

    // Give Authorizer Lambda permissions to Secrets Manager
    cfSecret.secret.grantRead(authorizerLambda.function);


    const authorizerLambdaLogs  = new logs.LogGroup(this, "AuthorizerLambdaLogs", {
      logGroupName: `/aws/lambda/authorizer-lambda`,
      retention: cwlogs.RetentionDays.ONE_WEEK
    })

    const counterAPIGatewayLogs  = new logs.LogGroup(this, "CounterAPIGatewayLogs", {
      logGroupName: `/aws/api-gateway/counter`,
      retention: cwlogs.RetentionDays.ONE_WEEK
    })

    // API Gateway with Lambda Integration and Authorizer
    const api = new BackendApi(this, "CounterApi", {
      
      apiName: "visitor-counter-api",
      applicationLambda: counterLambda.function,
      authorizerLambda: authorizerLambda.function,
      path: "/count",
      methods: ["GET"],
      loggroup : counterAPIGatewayLogs.logGroup,
      allowOrigins: ["https://resume.sayaji.dev"],
      allowMethods: [
        apigatewayv2.CorsHttpMethod.GET,
        apigatewayv2.CorsHttpMethod.POST,
        apigatewayv2.CorsHttpMethod.OPTIONS,
      ],
      allowHeaders: ["Content-Type", "Accept"],
      exposeHeaders: [],
      maxAge: cdk.Duration.seconds(3600),
});



    this.apiUrl = api.api.apiEndpoint;
    this.cfSecret = cfSecret.secret;

    // Outputs
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.api.apiEndpoint,
    });

    new cdk.CfnOutput(this, "SecretArn", {
      value: cfSecret.secret.secretArn,
    });
  }
}