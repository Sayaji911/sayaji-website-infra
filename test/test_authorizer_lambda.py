import unittest
from unittest import mock
from lambda_functions.authorizer import index
import json
import os


def mockedSuccessLambdaResponse():
    return {
        "principalId": "arn:aws:iam::111122223333:user/Alice",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/"
                }
            ]
        },
    }


def mockedFailLambdaResponse():
    return {"statusCode": 500, "body": json.dumps({"message": "Internal Server Error"})}


class AuthorizerLambdaTest(unittest.TestCase):
    @mock.patch(
        "lambda_functions.authorizer.index.handler",
        side_effect=mockedSuccessLambdaResponse,
    )
    @mock.patch.dict(os.environ, {"AWS_REGION": "us-east-1"})
    @mock.patch.dict(os.environ, {"SECRET_NAME": "test-secret"})
    def test_valid_lambda_response_allow(self, mock_handler) -> None:
        response: dict = index.handler()

        expected_response: dict = {
            "principalId": "arn:aws:iam::111122223333:user/Alice",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Allow",
                        "Resource": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/",
                    }
                ],
            },
        }
        self.assertEqual(expected_response, response)



    @mock.patch(
        "lambda_functions.authorizer.index.handler",
        side_effect=mockedFailLambdaResponse,
    )
    @mock.patch.dict(os.environ, {"AWS_REGION": "us-east-1"})
    @mock.patch.dict(os.environ, {"SECRET_NAME": "test-secret"})
    def test_valid_lambda_response_deny(self, mock_handler) -> None:
        response: dict = index.handler()

        expected_response: dict = {
            "principalId": "arn:aws:iam::111122223333:user/Alice",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Deny",
                        "Resource": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/",
                    }
                ],
            },
        }
        self.assertEqual(expected_response, response)

