#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { WebsiteStack } from "../lib/website-stack";
import { BaseInfraStack } from "../lib/base-infra-stack";

const app = new cdk.App();

const base = new BaseInfraStack(app, "BaseInfraStack", {
  env: { account: "381492077721", region: "us-east-1" }, // cert must be us-east-1
  crossRegionReferences: true
});

new WebsiteStack(app, "WebsiteStack", {
  env: { account: "381492077721", region: "us-east-1" }, // or wherever you want
  hostedZoneId: base.hostedZone.hostedZoneId,
  hostedZoneName: "sayaji.dev",
  certificateArn: base.certificate.certificateArn,
});
