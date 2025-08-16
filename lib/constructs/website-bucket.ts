import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';



export interface MyBuckerProps{
    bucketName?: string;
    indexDocument: string
    errorDocument: string
}


export class WebsiteBucket extends Construct {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: MyBuckerProps) {
        super(scope,id);


        this.bucket = new s3.Bucket(this, 'Bucket', {
            bucketName: props?.bucketName,
            websiteIndexDocument:props?.indexDocument,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
    });
        

    }
}