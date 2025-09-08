import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface MySecretProps {
  secretName: string;
  secretString?: string; // optional default value
  secretKey: string
}

export class BackendSecret extends Construct {
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: MySecretProps) {
    super(scope, id);

    this.secret = new secretsmanager.Secret(this, props.secretName, {
      secretName: props.secretName,
      generateSecretString: {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: 'x-cf-secret',

          // excludeCharacters: '/@"',
        },

      description: "Secret for CloudFront header validation",
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // for dev/testing

    });

  }
}
