import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as authorizer from "aws-cdk-lib/aws-apigatewayv2-authorizers";

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

    this.api = new apigateway.HttpApi(this, "HttpApi", {
      apiName: props.apiName,
      createDefaultStage: true,
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

    // 3️⃣ Add /count route with Lambda integration + authorizer
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
