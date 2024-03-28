FROM docker.io/library/python:3.12-slim

COPY requirements.lock /workspace/

WORKDIR /workspace

# ref: https://github.com/astral-sh/rye/discussions/239
RUN sed '/^-e/d' /workspace/requirements.lock > /workspace/requirements.txt && \
    mkdir /workspace/tmp && \
    pip install -r /workspace/requirements.txt --no-cache-dir --prefix=/workspace/tmp && \
    rm -rf /workspace/tmp/bin && \
    mkdir -p /asset/python && \
    mv /workspace/tmp/lib -t /asset/python
