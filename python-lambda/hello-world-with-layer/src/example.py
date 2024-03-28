from datetime import datetime
from pprint import pprint

import orjson


def hello():
    now = datetime.now()
    body = {
        "message": "Hello, world",
        "date": now.isoformat(),
    }
    pprint(orjson.dumps(body))
