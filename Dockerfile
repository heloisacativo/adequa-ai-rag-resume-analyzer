FROM python:3.11-slim

WORKDIR /code

COPY ./requirements-light.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

RUN mkdir -p /code/cache && chmod 777 /code/cache
ENV HF_HOME=/code/cache
ENV TRANSFORMERS_CACHE=/code/cache

COPY . /code

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

COPY --chown=user . $HOME/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]