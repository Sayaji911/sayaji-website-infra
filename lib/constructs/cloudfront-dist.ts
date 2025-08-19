import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { URL } from "url";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
export interface MyCloudfrontProps {
  origin: cloudfront.IOrigin;
  defaultRootObject?: string;
  hostedZone: route53.IHostedZone;
  recordName: string;
  certificate: acm.ICertificate;
  domainNames: string[];
  apiUrl?: string; // e.g. "https://abc123.execute-api.us-east-1.amazonaws.com"
  apiPath?: string; // e.g. "/count" or "/api/*"
  cfSecret: secretsmanager.ISecret;
}

export class WebsiteDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly record: route53.ARecord;

  constructor(scope: Construct, id: string, props: MyCloudfrontProps) {
    super(scope, id);

    // Build API origin if provided
    const apiOrigin = props.apiUrl
      ? new origins.HttpOrigin(
          cdk.Fn.select(2, cdk.Fn.split("/", props.apiUrl)),
          {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            customHeaders: {
              "x-cf-secret": props.cfSecret.secretValue.unsafeUnwrap() // Use unsafeUnwrap()
            },
          }
        )
      : undefined;

    this.distribution = new cloudfront.Distribution(
      this,
      "CloudfrontDistribution",
      {
        defaultBehavior: {
          origin: props.origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors:
          props.apiUrl && props.apiPath && apiOrigin
            ? {
                [props.apiPath]: {
                  origin: apiOrigin,
                  viewerProtocolPolicy:
                    cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                  cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                },
              }
            : undefined,
        defaultRootObject: props.defaultRootObject ?? "index.html",
        domainNames: props.domainNames,
        certificate: props.certificate,
      }
    );

    this.record = new route53.ARecord(this, "AliasRecord", {
      zone: props.hostedZone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
    });
  }
}
