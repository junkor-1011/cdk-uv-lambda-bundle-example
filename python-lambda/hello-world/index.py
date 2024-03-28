from datetime import datetime
from pprint import pprint

from lib.schemas import Response


def handler(event, context):
    # debug
    pprint(f"event: {event}")
    pprint(f"context: {context}")

    res = Response(
        **{
            "id": 90,
            "message": "Hello, World!",
            "datetime": datetime.now().isoformat(),
        }
    )

    return {
        "statusCode": 200,
        "body": res.model_dump_json(),
    }
