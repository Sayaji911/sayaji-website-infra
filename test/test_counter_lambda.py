import os


os.environ["TABLE_NAME"] = "test-counter-table"


import unittest
from unittest import mock
from lambda_functions.counter.index import handler
import json
from botocore.exceptions import ClientError


class CounterLambdaTest(unittest.TestCase):

    @mock.patch.dict("os.environ", {"TABLE_NAME": "test-counter-table"})
    @mock.patch("lambda_functions.counter.index.table")
    def test_lambda_success_update_dynamo_table(self, mock_table):

        mock_table.put_item.return_value = {}
        mock_table.scan.return_value = {"Count": 123}

        event = {"headers": {"x-forwarded-for": "110.157.34.08, 10.12.11.0"}}
        response = handler(event, None)

        expected = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"ip": "110.157.34.08", "unique_visitors": 123}),
        }
        self.assertEqual(expected, response)

    @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
    @mock.patch(
        "lambda_functions.counter.index.table",
    )
    def test_lambd_no_ip_in_request(self, mock_handler) -> None:
        mock_handler.side_effect = ClientError
        event = {"headers": {"x-forwarded-for": ""}}

        response = handler(event, context=None)

        expected_response = {
            "statusCode": 400,
            "body": json.dumps({"message": "No IP found"}),
        }

        self.assertEqual(expected_response, response)

    @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
    @mock.patch(
        "lambda_functions.counter.index.table",
    )
    def test_lambda_exception(self, mock_handler) -> None:
        event = {"headers": {"x-forwarded-for": "110.157.34.08, 10.12.11.0"}}

        response = handler(event, context=None)

        expected_response = {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal Server Error"}),
        }

        self.assertEqual(expected_response, response)

    @mock.patch("lambda_functions.counter.index.table.put_item")
    @mock.patch("lambda_functions.counter.index.table.scan")
    def test_lambda_ip_already_exists(self, mock_scan, mock_put_item):
        # Simulate ConditionalCheckFailedException
        mock_put_item.side_effect = ClientError(
            {
                "Error": {
                    "Code": "ConditionalCheckFailedException",
                    "Message": "Already exists",
                }
            },
            "PutItem",
        )
        mock_scan.return_value = {"Count": 5}

        event = {"headers": {"x-forwarded-for": "1.2.3.4, 10.0.0.1"}}
        response = handler(event, None)

        expected = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"ip": "1.2.3.4", "unique_visitors": 5}),
        }
        self.assertEqual(expected, response)
