import json
import boto3
from botocore.exceptions import ClientError
import os

REGION_NAME = os.environ.get("AWS_REGION", "us-east-1")
# This matches the secret name from backend-stack.ts
SECRET_NAME = os.environ.get("SECRET_NAME", "cf-secret")

client = boto3.client("secretsmanager", region_name=REGION_NAME)

def handler(event, context):
    print("Event:", json.dumps(event))

    try:
        secret_response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_data = json.loads(secret_response['SecretString'])
        # This matches the secretKey from backend-stack.ts
        expected_secret = secret_data['x-cf-secret']
    except ClientError as e:
        print("Error fetching secret:", e)
        return {"isAuthorized": False}

    headers = event.get("headers", {})
    provided_secret = headers.get("x-cf-secret")

    print("Expected:", expected_secret, "Provided:", provided_secret)

    if provided_secret == expected_secret:
        return {"isAuthorized": True, "context": {"user": "cloudfront"}}
    else:
        return {"isAuthorized": False}