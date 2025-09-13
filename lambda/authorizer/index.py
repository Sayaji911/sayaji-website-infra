import json
import boto3
from botocore.exceptions import ClientError
import os

REGION_NAME = os.environ.get("AWS_REGION", "us-east-1")
SECRET_NAME = os.environ.get("SECRET_NAME", "cf-secret")

client = boto3.client("secretsmanager", region_name=REGION_NAME)

def handler(event, context):
    print("Event:", json.dumps(event))

    try:
        secret_response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_data = json.loads(secret_response['SecretString'])
        expected_secret = secret_data['x-cf-secret']
    except ClientError as e:
        print("Error fetching secret:", e)
        return generate_policy('user', 'Deny', event['methodArn'])

    headers = event.get("headers", {})
    provided_secret = headers.get("x-cf-secret")

    print("Expected:", expected_secret, "Provided:", provided_secret)

    if provided_secret == expected_secret:
        return generate_policy('user', 'Allow', event['methodArn'])
    else:
        return generate_policy('user', 'Deny', event['methodArn'])

def generate_policy(principal_id, effect, resource):
    return {
        "principalId": principal_id,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource
                }
            ]
        },
    }