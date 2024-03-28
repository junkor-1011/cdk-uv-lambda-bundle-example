FROM docker.io/library/python:3.12-slim

COPY ./ /asset/

WORKDIR /asset

# ref: https://github.com/astral-sh/rye/discussions/239
RUN sed '/^-e/d' /asset/requirements.lock > /asset/requirements.txt && \
    pip install -r /asset/requirements.txt --no-cache-dir -t /asset && \
    rm /asset/requirements* && \
    rm -rf __pycache__
