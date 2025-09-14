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


  // CORS config
  allowCredentials?: boolean;
  allowHeaders?: string[];
  allowMethods?: apigatewayv2.CorsHttpMethod[];
  allowOrigins?: string[];
  exposeHeaders?: string[];
  maxAge?: cdk.Duration;
}

export class BackendApi extends Construct {
  public readonly api: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: BackendApiProps) {
    super(scope, id);


    // HttpApi without default stage (we’ll define our own)
    this.api = new apigatewayv2.HttpApi(this, "HttpApi", {
      apiName: props.apiName,
      createDefaultStage: false,
      corsPreflight: {
        allowCredentials: props.allowCredentials ?? true,
        allowHeaders: props.allowHeaders ?? ["Content-Type", "Authorization"],
        allowMethods: props.allowMethods ?? [apigatewayv2.CorsHttpMethod.ANY],
        allowOrigins: props.allowOrigins ?? ["*"],
        exposeHeaders: props.exposeHeaders,
        maxAge: props.maxAge ?? cdk.Duration.days(10),
      },
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
          authorizerError: "$context.authorizer.error"
        }),
      },
      defaultRouteSettings: {
        throttlingRateLimit: 1, 
        throttlingBurstLimit: 2, 
      }
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
