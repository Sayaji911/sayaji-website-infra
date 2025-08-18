import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebsiteBucket } from "./constructs/website-bucket";
import { WebsiteDistribution } from "./constructs/cloudfront-dist";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";

interface WebsiteStackProps extends cdk.StackProps {
  hostedZoneId: string;        // fix type: HostedZone ID is a string
  hostedZoneName: string;      // zone name
  certificateArn: string;      // ACM cert ARN
}

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    const blogSite = new WebsiteBucket(this, "BlogBucket", {
      bucketName: "blog.sayaji.dev",
      indexDocument: "index.html",
      errorDocument: "error.html",
    });

    // Import Hosted Zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "ImportedZone", {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName,
    });

    // Import ACM Certificate
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "ImportedCert",
      props.certificateArn
    );

    // CloudFront Distribution for blog site
    const blogDistribution = new WebsiteDistribution(this, "BlogDistribution", {
      origin: origins.S3BucketOrigin.withOriginAccessControl(blogSite.bucket),
      domainNames: ["blog.sayaji.dev"],
      certificate,
      hostedZone,                     // imported earlier
      recordName: "blog",             // subdomain
    });

    // new route53.ARecord(this, "BlogAliasRecord", {
    //   zone: hostedZone,
    //   recordName: "blog.sayaji.dev",
    //   target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(blogDistribution.distribution)),
    // });
  }
}
