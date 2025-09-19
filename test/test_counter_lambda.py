import unittest
from unittest import mock
from lambda_functions.counter import index
import json
import os


def mockedSuccessDynamoResponse():
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,x-cf-secret",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps({"visits": 12}),
    }


def mockedFaileDynamoResponse():
    return {"statusCode": 500, "body": json.dumps({"message": "Internal Server Error"})}


class CounterLambdaTest(unittest.TestCase):
    @mock.patch(
        "lambda_functions.counter.index.handler",
        side_effect=mockedSuccessDynamoResponse,
    )
    @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
    def test_valid_lambda_response(self, mock_handler) -> None:
        response: dict = index.handler()

        expected_response: dict = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,x-cf-secret",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
            },
            "body": json.dumps({"visits": 12}),
        }

        self.assertEqual(expected_response, response)

    @mock.patch(
        "lambda_functions.counter.index.handler",
        side_effect=mockedFaileDynamoResponse,
    )
    @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
    def test_invalid_lambda_response(self, mock_handler) -> None:
        response: dict = index.handler()

        expected_response: dict = {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal Server Error"}),
        }

        self.assertEqual(expected_response, response)
