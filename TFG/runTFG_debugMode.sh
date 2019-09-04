#!/bin/bash

export FLASK_APP=runFlask.py
export FLASK_ENV=development
python3 -m webbrowser "http://localhost:5000/"
python3 -m flask run
