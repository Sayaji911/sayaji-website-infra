import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebsiteBucket } from "./constructs/website-bucket";
import { WebsiteDistribution } from "./constructs/cloudfront-dist";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"

interface BaseWebsiteStackProps extends cdk.StackProps {
  hostedZoneId: string;
  hostedZoneName: string;
  certificateArn: string;
  siteDomain: string;
  sitePrefix: string;
  apiUrl?: string;        // Optional API props
  apiPath?: string;
  cfSecret: secretsmanager.ISecret;
}

abstract class BaseWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BaseWebsiteStackProps) {
    super(scope, id, props);

    const site = new WebsiteBucket(this, `${props.sitePrefix}Bucket`, {
      bucketName: props.siteDomain,
      indexDocument: "index.html",
      errorDocument: "error.html",
    });

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "ImportedZone", {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName,
    });

    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "ImportedCert",
      props.certificateArn
    );

    const distribution = new WebsiteDistribution(this, `${props.sitePrefix}Distribution`, {
      origin: origins.S3BucketOrigin.withOriginAccessControl(site.bucket),
      domainNames: [props.siteDomain],
      certificate,
      hostedZone,
      recordName: props.sitePrefix,
      apiUrl: props.apiUrl,
      apiPath: props.apiPath,
      cfSecret: props.cfSecret,
    });
  }
}

// Blog site without API integration
export class WebsiteStack extends BaseWebsiteStack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & BaseWebsiteStackProps) {
    super(scope, id, {
      ...props,
      siteDomain: "blog.sayaji.dev",
      sitePrefix: "blog"
    });
  }
}

// Resume site with API integration
export class ResumeStack extends BaseWebsiteStack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & BaseWebsiteStackProps) {
    super(scope, id, {
      ...props,
      siteDomain: "resume.sayaji.dev",
      sitePrefix: "resume",
      apiPath: "/count",  // Only ResumeStack uses the API
      apiUrl: props.apiUrl,
      cfSecret: props.cfSecret
    });
  }
}