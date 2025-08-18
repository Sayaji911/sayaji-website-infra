import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

interface MyDomainCertProps {
  domainName: string;
}

export class WebsiteCertDomain extends Construct {
  public readonly certificate: acm.Certificate;
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: MyDomainCertProps) {
    super(scope, id);

    this.hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: props.domainName,
    });

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [
        `*.${props.domainName}`, // covers devops.sayaji.dev, resume.sayaji.dev, etc
      ],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
