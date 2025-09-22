import os
import json
import boto3
import logging

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients outside the handler (cold start optimization)
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# DynamoDB table name from environment variable
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    

    try:
        resp = table.update_item(
            Key={'id': 'counter'},
            UpdateExpression='ADD visits :inc',
            ExpressionAttributeValues={':inc': 1},
            ReturnValues='UPDATED_NEW'
        )
        new_count = int(resp['Attributes']['visits'])
        logger.info(f"DynamoDB updated successfully. New count: {new_count}")
    except Exception as e:
        logger.error(f"Error updating DynamoDB: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal Server Error"})
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,x-cf-secret",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps({"visits": new_count})
    }