import os
import json
import random
import sys
import datetime
import time
import numpy as numpy
import create_and_insert_JSON_to_DB

#Condiciones iniciales
esMatrizMarkov = True
usersNum = 5
arrayDimension = 4
arraysNum = 5
sigma = 0.01

#Obtiene el directorio donde está situado este fichero python
workingDir = os.getcwd()
#generatedJSONDir = workingDir + '/..' + os.sep + 'TFG' + os.sep + 'generatedJSON'
generatedJSONDir = workingDir + os.sep + 'TFG' + os.sep + 'generatedJSON'

usersNum = int(input("Introduce el numero de usuarios deseados >> "))
arrayDimension = int(input("Introduce la dimensión de la matriz de transición >> "))
arraysNum = int(input("Introduce el número de matrices de transición del usuario monitorizado >> "))

def comprobarLimitesParámetros(inputNum):
    if (isinstance(inputNum, int)) and (inputNum > 0):
        return inputNum
    else:
        print("Un argumento introducido no es válido")
        return 5

usersNum = comprobarLimitesParámetros(usersNum)
arrayDimension = comprobarLimitesParámetros(arrayDimension)
arraysNum = comprobarLimitesParámetros(arraysNum)

#Aleatorizar arrayToJSON en una matriz estocastica
#Sólo hasta los elementos N - 1
def generarMatrizEstocastica():
    #Se inicializara una matriz de (N+1)x(N+1) para situar en los bordes la suma de las filas y columnas
    arrayToJSON = [[1 for x in range(arrayDimension + 1)] for y in range(arrayDimension + 1)] 
    for i in range(arrayDimension - 1):
        for j in range(arrayDimension - 1):
            #Rellena de manera aleatoria la matriz hasta (N-1)x(N-1)
            #El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            temp = min(arrayToJSON[arrayDimension][j], arrayToJSON[i][arrayDimension])
            arrayToJSON[i][j] = random.uniform(0,temp)
            arrayToJSON[arrayDimension][j] -= arrayToJSON[i][j]
            arrayToJSON[i][arrayDimension] -= arrayToJSON[i][j]

    for i in range(arrayDimension):
        for j in range(arrayDimension):
            #Rellena ajustando m. estocástica la última fila y columna de la matriz NxN
            #El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            if (i == arrayDimension - 1) and (j == arrayDimension - 1):
                #La ultima fila y columna de la matriz NxN
                arrayToJSON[i][j] = arrayToJSON[arrayDimension][j]
                arrayToJSON[arrayDimension][j] -= arrayToJSON[i][j]
                arrayToJSON[i][arrayDimension] -= arrayToJSON[i][j]
            else:
                #Cualesquiera de la ultima fila o columna
                if i == arrayDimension - 1:
                    arrayToJSON[i][j] = arrayToJSON[arrayDimension][j]
                    arrayToJSON[arrayDimension][j] -= arrayToJSON[i][j]
                    arrayToJSON[i][arrayDimension] -= arrayToJSON[i][j]
                if j == arrayDimension - 1:
                    arrayToJSON[i][j] = arrayToJSON[i][arrayDimension]
                    arrayToJSON[arrayDimension][j] -= arrayToJSON[i][j]
                    arrayToJSON[i][arrayDimension] -= arrayToJSON[i][j]
    return arrayToJSON

#Comprobacion que es matriz estocástica
def comprobarMatrizEstocastica(arrayToJSON):
    filaSuma = 0
    columnaSuma = 0
    for i in range(arrayDimension):
        for j in range(arrayDimension):
            filaSuma += arrayToJSON[i][j]
            columnaSuma += arrayToJSON[j][i]
        print("Fila " + str(i + 1) + " suma " + str(filaSuma))
        print("Columna " + str(i + 1) + " suma " + str(columnaSuma))
        filaSuma = 0
        columnaSuma = 0

#Generar matriz con el que un usuario activo está realizando actividad en la navegación web
#Simulación del usuario en la navegación web
#Define la sigma si (sigma < 0.01) para actividad normal, (sigma > 0.1) para actividad de pishing
def generateUserActivity(arrayToJSON, sigma):
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
    return activityArray


#Bucle para crear n ficheros JSON
for user_i in range(usersNum):
    #print(str(user_i))
    nombreFicheroGenerado = 'user_' + str(user_i) + '.json'

    #Creamos o modificamos el fichero json seleccionado
    try:
        generatedJSONFile = open(generatedJSONDir + os.sep + nombreFicheroGenerado, 'w+')
    except:
        generatedJSONDir = workingDir + os.sep + 'generatedJSON'
        generatedJSONFile = open(generatedJSONDir + os.sep + nombreFicheroGenerado, 'w+')

    #Escribimos el fichero json seleccionado
    generatedJSONFile.write('{' + '\n')
    generatedJSONFile.write('"user": "user_' + str(user_i) + '",' + '\n')
    generatedJSONFile.write('"user_info": {' + '\n')
    generatedJSONFile.write('\t' + '"active":true,' + '\n')
    generatedJSONFile.write('\t' + '"json_timestamp":"' + str(datetime.datetime.now()) + '",' + '\n')
    millis = time.time() * 1000 #da un float y las unidades son milisegundos
    generatedJSONFile.write('\t' + '"json_timestamp_epoch":"' + str(millis) + '",' + '\n')
    epochInfo = "json_timestamp_epoch is the time in milliseconds since the epoch as a floating point number. Epoch is designed to be January 1, 1970, 00:00:00 (UTC)"
    generatedJSONFile.write('\t' + '"json_timestamp_epoch_info":"' + epochInfo + '"' + '\n')
    generatedJSONFile.write('},\n')

    for array_i in range(arraysNum):
        #Generamos matriz estocástica para array_i
        arrayToJSON = generarMatrizEstocastica()
        print("Comprobando M. Estocástica de arrayToJSON \n")
        comprobarMatrizEstocastica(arrayToJSON)

        #Escribimos el modelo de navegación del usuario en enésimos markovData
        generatedJSONFile.write('"modelUserData_' + str(array_i) +'": [')
        for i in range(arrayDimension):
            #Fila i del array
            generatedJSONFile.write('\n\t\t[')
            for j in range(arrayDimension):
                if esMatrizMarkov:
                    generatedJSONFile.write(' ' + str(arrayToJSON[i][j]))
                else:
                    generatedJSONFile.write(' ' + str(random.uniform(0,1)))
                if j == arrayDimension - 1:
                    generatedJSONFile.write(' ]')
                    if i != arrayDimension - 1:
                        generatedJSONFile.write(',')
                    else:
                        generatedJSONFile.write("\n\t]")
                else:
                    generatedJSONFile.write(',')
            j += 1
        i += 1
        if array_i != arraysNum - 1:
            generatedJSONFile.write(',\n')

    generatedJSONFile.write(",\n")
    for array_i in range(arraysNum):
        activityArray = generateUserActivity(arrayToJSON, sigma)
        print("Comprobando M. Estocástica de activityArray \n")
        comprobarMatrizEstocastica(activityArray)
        #Escribimos el modelo de navegación del usuario en enésimos markovData
        generatedJSONFile.write('"activityUserData_' + str(array_i) +'": [')
        for i in range(arrayDimension):
            #Fila i del array
            generatedJSONFile.write('\n\t\t[')
            for j in range(arrayDimension):
                if esMatrizMarkov:
                    generatedJSONFile.write(' ' + str(activityArray[i][j]))
                else:
                    generatedJSONFile.write(' ' + str(random.uniform(0,1)))
                if j == arrayDimension - 1:
                    generatedJSONFile.write(' ]')
                    if i != arrayDimension - 1:
                        generatedJSONFile.write(',')
                    else:
                        generatedJSONFile.write("\n\t]")
                else:
                    generatedJSONFile.write(',')
            j += 1
        i += 1
        if array_i != arraysNum - 1:
            generatedJSONFile.write(',\n')

    generatedJSONFile.write('\n}')
    generatedJSONFile.close()

