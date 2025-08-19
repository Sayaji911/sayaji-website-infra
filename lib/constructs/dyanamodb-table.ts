import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface MyDynamoTableProps {
  tableName: string;
  partitionKey: string;
}

export class BackendDynamoTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: MyDynamoTableProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, props.tableName, {
      tableName: props.tableName,
      partitionKey: {
        name: props.partitionKey,
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
