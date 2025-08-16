import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebsiteBucket } from "./constructs/website-bucket";

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const resumeSite = new WebsiteBucket(this, "DevopsBucket", {
      bucketName: "devops.sayaji.dev",
      indexDocument: "index.html",
      errorDocument: "error.html",
    });

    const blogSite = new WebsiteBucket(this, "BlogBucket", {
      bucketName: "blog.sayaji.dev",
      indexDocument: "index.html",
      errorDocument: "error.html",
    });
  }
}
