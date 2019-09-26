#Documentacion 1: Quickstart con Flask: https://flask.palletsprojects.com/en/1.1.x/quickstart/#quickstart

import os
import sqlite3
import json
import create_and_insert_JSON_to_DB
import manageMonitoredUsersDB
import numpy as numpy
from react.render import render_component
from flask import Flask, request, jsonify
app = Flask(__name__)

urlReactApp = "http://localhost:3000"
user_infoGlobal = None

@app.route('/')
def index():
    html = "<html>"
    html = html + "<h1>Bienvenido</h1>"
    html = html + "<a href='http://localhost:3000/'>Ir a visualizaciones</a><br>"
    html = html + "<a href='http://localhost:5000/monitoredUsers'>Todos los usuarios monitorizados</a><br>"
    all_monitoredUser = manageMonitoredUsersDB.get_all_onlyNamesMonitoredUsers()
    for eachName in all_monitoredUser:
        html = html + "<a href='http://localhost:5000/monitoredUser/" + eachName[0] + "'>" + eachName[0] + "</a><br>"
    html = html + "</html>"
    return html

@app.route('/monitoredUsers', methods=['GET', 'POST'])
def collection():
    if request.method == 'GET':
        all_monitoredUser = manageMonitoredUsersDB.get_all_onlyNamesMonitoredUsers()
        temp = jsonify(allMonitoredUser = all_monitoredUser)
        temp = response_with_cors_same_origin_allowed(temp)
        return temp
    elif request.method == 'POST':
        pass  # Handle POST request


@app.route('/monitoredUser/<monitoredUser_id>', methods=['GET', 'PUT', 'DELETE'])
def resource(monitoredUser_id):
    simulate = request.args.get('simulate')
    #print("\n" + "\033[94m" + "El parametro URL simulate es: " + str(simulate) + "\033[0m" +  "\n")
    if (simulate is None):
        simulate = False
    elif not simulate == "1":
        simulate = False
    elif simulate == "1":
        simulate = True
    #print("\033[94m" + "Variable simulate es: " + str(simulate) + "\033[0m" +  "\n")
    if request.method == 'GET':
        if isinstance(monitoredUser_id, int):
            monitoredUserSelected = manageMonitoredUsersDB.get_monitoredUser(monitoredUser_id)
        else:
            monitoredUserSelected = manageMonitoredUsersDB.get_monitoredUserByName(monitoredUser_id)
        temp = monitoredUserSelected[2]
        temp = temp.replace("'", "\"")
        temp = temp.replace("True", "true")
        temp = temp.replace("False", "false")
        #print("\n" + "\033[92m" + str(temp) + "\033[0m" +  "\n")
        temp = json.loads(temp)
        temp = extractKeysFromMonitoredJSON(temp)
        response = jsonify(
            id = monitoredUserSelected[0],
            monitoredUser = monitoredUserSelected[1],
            user_info = user_infoGlobal,
            monitoredJSON = simulateActivity(temp, simulate),
            compare = diferenciarModeloYActividad(temp)
            )
        response = response_with_cors_same_origin_allowed(response)
        return response
    elif request.method == 'PUT':
        pass  # Handle UPDATE request
    elif request.method == 'DELETE':
        pass  # Handle DELETE request

def simulateActivity(temp, simulate):
    if simulate == 0:
        return temp
    else:
        argumentoJSONIFY = temp
        numeroDeVariables = 0
        for element in temp:
            numeroDeVariables += 1

        numeroDeVariables -= 1
        numeroDeVariables = int(numeroDeVariables/2)
        for compare_i in range(numeroDeVariables):
            modifyActivity = temp["activityUserData_" + str(compare_i)]
            sigma = 0.01
            modifyActivity = generateUserActivity(modifyActivity, sigma)
            temp["activityUserData_" + str(compare_i)] = modifyActivity
        return argumentoJSONIFY

def diferenciarModeloYActividad(temp):
    argumentoJSONIFY = {}
    numeroDeVariables = 0
    for element in temp:
        #print("\n" + "\033[92m" + str(element) + "\033[0m" +  "\n")
        numeroDeVariables += 1
    #print("\n" + "\033[92m" + str(numeroDeVariables) + "\033[0m" +  "\n")

    numeroDeVariables -= 1
    numeroDeVariables = int(numeroDeVariables/2)
    #print("\n" + "\033[92m" + str(numeroDeVariables) + "\033[0m" +  "\n")
    for compare_i in range(numeroDeVariables):
        arrayModel = temp["modelUserData_" + str(compare_i)]
        arrayActivity = temp["activityUserData_" + str(compare_i)]
        arrayDimension = len(arrayModel)
        arrayCompare = [[1 for x in range(arrayDimension)] for y in range(arrayDimension)] 
        for i in range(arrayDimension):
            for j in range(arrayDimension):
                arrayCompare[i][j] = abs(arrayModel[i][j] - arrayActivity[i][j]) 
                #print("arrayDiferencia[" + str(i) + "][" + str(j) + "] = " + str(arrayCompare[i][j]))
        argumentoJSONIFY["compare_" + str(compare_i)] = arrayCompare
    return argumentoJSONIFY


def response_with_cors_same_origin_allowed(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = urlReactApp
    return response

#Generar matriz con el que un usuario activo está realizando actividad en la navegación web
#Simulación del usuario en la navegación web
#Define la sigma si (sigma < 0.01) para actividad normal, (sigma > 0.1) para actividad de pishing
def generateUserActivity(arrayToJSON, sigma):
    arrayDimension = len(arrayToJSON[0])
    activityArray = [[1 for x in range(arrayDimension + 1)] for y in range(arrayDimension + 1)] 
    for i in range(arrayDimension - 1):
        for j in range(arrayDimension - 1):
            #Rellena de manera aleatoria la matriz hasta (N-1)x(N-1)
            #El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            mu = arrayToJSON[i][j]
            valorNormal = numpy.random.normal(mu, sigma)
            if valorNormal < 0:
                valorNormal = abs(valorNormal)
            if valorNormal > 1:
                valorNormal = valorNormal - 1
                valorNormal = 1 - valorNormal
            activityArray[i][j] = valorNormal
            activityArray[arrayDimension][j] -= activityArray[i][j]
            activityArray[i][arrayDimension] -= activityArray[i][j]

    for i in range(arrayDimension):
        for j in range(arrayDimension):
            #Rellena ajustando m. estocástica la última fila y/o columna de la matriz NxN
            #El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            if (i == arrayDimension - 1) and (j == arrayDimension - 1):
                #La ultima fila y columna de la matriz NxN
                activityArray[i][j] = activityArray[arrayDimension][j]
                activityArray[arrayDimension][j] -= activityArray[i][j]
                activityArray[i][arrayDimension] -= activityArray[i][j]
            else:
                #Cualesquiera de la ultima fila o columna
                if i == arrayDimension - 1:
                    activityArray[i][j] = activityArray[arrayDimension][j]
                    activityArray[arrayDimension][j] -= activityArray[i][j]
                    activityArray[i][arrayDimension] -= activityArray[i][j]
                if j == arrayDimension - 1:
                    activityArray[i][j] = activityArray[i][arrayDimension]
                    activityArray[arrayDimension][j] -= activityArray[i][j]
                    activityArray[i][arrayDimension] -= activityArray[i][j]

    truncatedActivityArray = [[1 for x in range(arrayDimension)] for y in range(arrayDimension)] 

    for i in range(arrayDimension):
        for j in range(arrayDimension):
            truncatedActivityArray[i][j] = activityArray[i][j]

    return truncatedActivityArray

def extractKeysFromMonitoredJSON(jsonObject):
    global user_infoGlobal
    #print("\n" + "\033[92m" + str(jsonObject) + "\033[0m" +  "\n")
    for key in jsonObject.keys():
        if  key == "user_info":
            user_infoGlobal = jsonObject[key]
    del jsonObject["user_info"]
    #print("\n" + "\033[94m" + str(jsonObject) + "\033[0m" +  "\n")
    return jsonObject