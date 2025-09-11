import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";

export interface LogGroupProps {
  logGroupName: string;
  retention?: logs.RetentionDays;
}

export class LogGroup extends Construct {
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: LogGroupProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: props.logGroupName,
      retention: props.retention ?? logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}