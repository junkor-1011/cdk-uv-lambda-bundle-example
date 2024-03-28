from pprint import pprint

import orjson
import requests

from src.example import hello


def handler(event, context):
    # debug
    pprint(f"event: {event}")
    pprint(f"context: {context}")

    hello()

    try:
        ip = requests.get("http://checkip.amazonaws.com/")
    except requests.RequestException as e:
        # Send some context about this error to Lambda Logs
        print(e)

        raise e

    return {
        "statusCode": 200,
        "body": orjson.dumps(
            {"message": "hello world", "location": ip.text.replace("\n", "")}
        ),
    }
