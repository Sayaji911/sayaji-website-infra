import os
import json
import boto3
import logging

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

        # Increment per-IP count
        resp = table.update_item(
            Key={"ip": src_ip},
            UpdateExpression="ADD #count :inc",
            ExpressionAttributeNames={"#count": "count"},
            ExpressionAttributeValues={":inc": 1},
            ReturnValues="UPDATED_NEW"
        )

        new_count = int(resp["Attributes"]["count"])
        logger.info(f"Updated {src_ip}: count = {new_count}")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"ip": src_ip, "count": new_count})
        }

    except Exception as e:
        logger.error(f"Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"message": "Internal Server Error"})}
