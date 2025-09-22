import os
import json
import unittest

from unittest import mock
from botocore.exceptions import ClientError

from lambda_functions.authorizer import index
class AuthoriserLambdaTest(unittest.TestCase):
    @mock.patch.dict(os.environ, {"SECRET_NAME": "test-secret"})
    @mock.patch.dict(os.environ, {"AWS_REGION": "us-east-1"})
    @mock.patch("lambda_functions.authorizer.index.client")
    def test_lambda_allows_request_with_valid_secret(self, mock_handler) -> None:

        mock_handler.get_secret_value.return_value = {
            "SecretString": json.dumps({"x-cf-secret": "abcd"})
        }

        event = {
            "headers": {"x-cf-secret": "abcd"},
            "methodArn": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/",
        }

        response: dict = index.handler(event=event, context=None)

        expected_response: dict = {
            "principalId": "user",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Allow",
                        "Resource": event["methodArn"],
                    }
                ],
            },
        }
        self.assertEqual(expected_response, response)

    @mock.patch.dict(os.environ, {"AWS_REGION": "us-east-1"})
    @mock.patch.dict(os.environ, {"SECRET_NAME": "test-secret"})
    @mock.patch("lambda_functions.authorizer.index.client")
    def test_lambda_denies_request_when_secrets_fetch_fails(self, mock_handler) -> None:

        mock_handler.get_secret_value.return_value = Exception("Some Secrets error")

        event = {
            "headers": {"x-cf-secret": "abcd"},
            "methodArn": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/",
        }
        response: dict = index.handler(event=event, context=None)

        expected_response: dict = {
            "principalId": "user",
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

    @mock.patch.dict(os.environ, {"AWS_REGION": "us-east-1"})
    @mock.patch.dict(os.environ, {"SECRET_NAME": "test-secret"})
    @mock.patch("lambda_functions.authorizer.index.client")
    def test_lambda_denies_request_with_invalid_secret(self, mock_handler) -> None:

        mock_handler.get_secret_value.return_value = {
            "SecretString": json.dumps({"x-cf-secret": "abcd"})
        }
        
        event = {
            "headers": {"x-cf-secret": "gfhi"},
            "methodArn": "arn:aws:execute-api:us-east-1:111122223333:ivdtdhp7b5/ESTestInvoke-stage/GET/",
        }
        response: dict = index.handler(event=event, context=None)

        expected_response: dict = {
            "principalId": "user",
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