import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export interface MyCloudfrontProps {
  origin: cloudfront.IOrigin;
  additonalBehaviors?: Record<string, cloudfront.BehaviorOptions>;
  defaultRootObject?: string;
  hostedZone: route53.IHostedZone;
  recordName: string;
  certificate: acm.ICertificate   // NEW
  domainNames: string[];                  // NEW
}

export class WebsiteDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly record: route53.ARecord;

  constructor(scope: Construct, id: string, props: MyCloudfrontProps) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(this, "CloudfrontDistribution", {
      defaultBehavior: {
        origin: props.origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: props.defaultRootObject ?? "index.html",
      domainNames: props.domainNames,
      certificate: props.certificate,
    });

    this.record = new route53.ARecord(this, "AliasRecord", {
      zone: props.hostedZone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
    });
  }
}
