import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface MyCloudfrontProps {
    s3Bucket: s3.IBucket;
}

//TODO: Add support for multiple origins

export class WebsiteDistribution extends Construct {
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: MyCloudfrontProps) {
        super(scope, id);

        this.distribution = new cloudfront.Distribution(this, "CloudfrontDistribution", {
            defaultBehavior: {
                origin: new origins.S3StaticWebsiteOrigin(props.s3Bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            defaultRootObject: "index.html",
        });
    }
}