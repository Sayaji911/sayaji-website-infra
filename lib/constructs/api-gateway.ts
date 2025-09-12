import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
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
  loggroup: logs.ILogGroup
}

export class BackendApi extends Construct {
  public readonly api: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: BackendApiProps) {
    super(scope, id);


    // HttpApi without default stage (we’ll define our own)
    this.api = new apigateway.HttpApi(this, "HttpApi", {
      apiName: props.apiName,
      createDefaultStage: false,
    });

    // Explicitly create $default stage with logging enabled
    new apigatewayv2.CfnStage(this, "DefaultStage", {
      apiId: this.api.apiId,
      stageName: "$default",
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: props.loggroup.logGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          ip: "$context.identity.sourceIp",
          userAgent: "$context.identity.userAgent",
          requestTime: "$context.requestTime",
          httpMethod: "$context.httpMethod",
          routeKey: "$context.routeKey",
          status: "$context.status",
          protocol: "$context.protocol",
          responseLength: "$context.responseLength",
          // Authorizer-related
          principalId: "$context.authorizer.principalId",
          userId: "$context.authorizer.userId",      // if your Lambda authorizer returns this
          claims: "$context.authorizer.claims",      // for JWT authorizer claims
          scopes: "$context.authorizer.scopes",      // for JWT authorizer scopes
          authorizerError: "$context.authorizer.error"
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
