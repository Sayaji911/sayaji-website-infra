import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv1 from "aws-cdk-lib/aws-apigateway"; // only for AccessLogFormat
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as authorizer from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as logs from "aws-cdk-lib/aws-logs";

export interface BackendApiProps {
  apiName: string;
  applicationLambda: lambda.Function;
  authorizerLambda: lambda.Function;
  path: string;
  methods: string[];
}

export class BackendApi extends Construct {
  public readonly api: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: BackendApiProps) {
    super(scope, id);

    // Create a log group for access logs
    const logGroup = new logs.LogGroup(this, "ApiAccessLogs", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // HttpApi without default stage (we’ll define our own)
    this.api = new apigateway.HttpApi(this, "HttpApi", {
      apiName: props.apiName,
      createDefaultStage: false,
    });

    // Explicitly create $default stage with logging enabled
    new apigateway.HttpStage(this, "DefaultStage", {
      httpApi: this.api,
      stageName: "$default",
      autoDeploy: true,
      accessLogSettings: {
        destination: new apigateway.LogGroupLogDestination(logGroup),
        format: apigatewayv1.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }),
      },
    });

    const lambdaAuthorizer = new authorizer.HttpLambdaAuthorizer(
      "LambdaAuthorizer",
      props.authorizerLambda,
      {
        identitySource: ["$request.header.x-cf-secret"],
      }
    );

    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      "BackendLambdaIntegration",
      props.applicationLambda
    );

    this.api.addRoutes({
      path: props.path,
      methods: props.methods.map(
        (m) => apigateway.HttpMethod[m as keyof typeof apigateway.HttpMethod]
      ),
      integration: lambdaIntegration,
      authorizer: lambdaAuthorizer,
    });
  }
}
