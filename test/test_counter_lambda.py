# import os


# os.environ["TABLE_NAME"] = "test-counter-table"


# import unittest
# from unittest import mock
# from lambda_functions.counter.index import handler
# import json

# class CounterLambdaTest(unittest.TestCase):
#     @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
#     @mock.patch(
#         "lambda_functions.counter.index.table.update_item",
#     )
#     def test_lambda_success_update_dynamo_table(self, mock_handler) -> None:

#         mock_handler.return_value = {"Attributes": {"visits": 125}}

#         handler_response = handler(event=None, context=None)

#         expected_response: dict = {
#             "statusCode": 200,
#             "headers": {
#                 "Content-Type": "application/json",
#                 "Access-Control-Allow-Origin": "*",
#                 "Access-Control-Allow-Headers": "Content-Type,x-cf-secret",
#                 "Access-Control-Allow-Methods": "GET,OPTIONS",
#             },
#             "body": json.dumps({"visits": 125})
#         }

#         self.assertEqual(expected_response, handler_response)

#     @mock.patch.dict(os.environ, {"TABLE_NAME": "test-counter-table"})
#     @mock.patch(
#         "lambda_functions.counter.index.table.update_item",
#     )
#     def test_lambda_fail_update_dynamo_table(self, mock_handler) -> None:
#         mock_handler.side_effect = ValueError("Some DynamoDB error")

#         response = handler(event=None, context=None)

#         expected_response = {
#             "statusCode": 500,
#             "body": json.dumps({"message": "Internal Server Error"}),
#         }

#         self.assertEqual(expected_response, response)
