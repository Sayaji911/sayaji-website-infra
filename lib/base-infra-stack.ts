import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebsiteCertDomain } from "./constructs/website-domain-cert"

export class BaseInfraStack extends cdk.Stack {

  public readonly hostedZone: cdk.aws_route53.IHostedZone;
  public readonly certificate: cdk.aws_certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Create Hosted Zone + ACM Certificate
    const certDomain = new WebsiteCertDomain(this, "MyDomainCert", {
      domainName: "sayaji.dev", 
    });

    this.hostedZone = certDomain.hostedZone;
    this.certificate = certDomain.certificate;

    // Outputs
    new cdk.CfnOutput(this, "HostedZoneId", {
      value: certDomain.hostedZone.hostedZoneId,
    });

    new cdk.CfnOutput(this, "HostedZoneNameServers", {
      value: cdk.Fn.join(", ", certDomain.hostedZone.hostedZoneNameServers ?? []),
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: certDomain.certificate.certificateArn,
    });
  }
}
