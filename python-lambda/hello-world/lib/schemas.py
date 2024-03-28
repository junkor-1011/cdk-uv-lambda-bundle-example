from datetime import datetime

from pydantic import (
    BaseModel,
    PositiveInt,
)


class Response(BaseModel):
    id: PositiveInt
    message: str
    datetime: datetime
