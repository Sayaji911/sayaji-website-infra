import os
import json
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table(os.environ["TABLE_NAME"])

def handler(event, context):
    try:
        headers = event.get("headers", {}) or {}
        src_ip = headers.get("x-forwarded-for", "").split(",")[0].strip()

        if not src_ip:
            return {"statusCode": 400, "body": json.dumps({"message": "No IP found"})}

        # Try to put new IP, but fail if it already exists
        try:
            table.put_item(
                Item={"id": src_ip},
                ConditionExpression="attribute_not_exists(id)"  # only insert if new
            )
        except ClientError as e:
            if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                raise  # real error
            # IP already exists → ignore

        # Count all unique IPs
        resp = table.scan(Select="COUNT")
        total = resp["Count"]

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"ip": src_ip, "unique_visitors": total})
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"message": "Internal Server Error"})}
