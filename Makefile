PYTHON ?= python

.PHONY: setup pipeline dashboard

setup:
	$(PYTHON) -m pip install -r requirements.txt
	npm --prefix dashboard ci

pipeline:
	$(PYTHON) pipeline.py

dashboard:
	npm --prefix dashboard run dev -- --host 0.0.0.0
