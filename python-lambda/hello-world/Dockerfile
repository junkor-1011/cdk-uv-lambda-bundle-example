FROM ghcr.io/astral-sh/uv:bookworm-slim

ENV PYTHON_VERSION=3.12

COPY ./ /asset/

WORKDIR /work

RUN --mount=type=bind,target=. uv export --no-dev --frozen --output-file /tmp/requirements.txt

RUN uv python install $PYTHON_VERSION && \
    uv venv && \
    uv pip install -r /tmp/requirements.txt --no-cache-dir --target /asset
