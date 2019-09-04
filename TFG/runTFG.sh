#!/bin/bash

export FLASK_APP=runFlask.py
python3 -m webbrowser "http://localhost:5000/"
python3 -m flask run
