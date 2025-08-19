#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { WebsiteStack, ResumeStack } from "../lib/website-stack";
import { BaseInfraStack } from "../lib/base-infra-stack";
import { BackendStack } from "../lib/backend-stack";

// Environment configuration
const env = {
  account: "381492077721",
  region: "us-east-1", // cert must be us-east-1
};

const app = new cdk.App();

// Base infrastructure stack
const base = new BaseInfraStack(app, "BaseInfraStack", {
  env,
  crossRegionReferences: true,
});

// Backend services stack
const backend = new BackendStack(app, "BackendStack", {
  env,
  crossRegionReferences: true,
});

// Common properties for website stacks
const baseProps = {
  env,
  hostedZoneId: base.hostedZone.hostedZoneId,
  hostedZoneName: "sayaji.dev",
  certificateArn: base.certificate.certificateArn,
  crossRegionReferences: true,
} as const;

new WebsiteStack(app, "WebsiteStack", {
  ...baseProps,
  siteDomain: "blog.sayaji.dev",
  sitePrefix: "blog",
  cfSecret: backend.cfSecret,

});

// Resume website stack (with API integration)
new ResumeStack(app, "ResumeStack", {
  ...baseProps,
  siteDomain: "resume.sayaji.dev",
  sitePrefix: "resume",
  apiUrl: backend.apiUrl,
  cfSecret: backend.cfSecret,
});


app.synth();