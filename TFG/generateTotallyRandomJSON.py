import os
import json
import random
import sys
import datetime
import time
import numpy as numpy
from random import randrange

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
arrayDimension = 4
arraysNum = randrange(3, 10)

def imprimirArrayPorConsola(array, colorCode): 
    consola = str(array)
    consola = consola.replace(", [", "\n")
    consola = consola.strip("[")
    consola = consola.strip("]")
    consola = consola.replace("]\n", "\n")
    print("\033[" + colorCode +"m" + consola + "\033[0m")

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

     #Comprobamos si la última fila o columna del array tiene algún elemento negativo
    for i in range(arrayDimension):
        if(arrayToJSON[i][arrayDimension - 1] < 0):
            print("\033[93m" + "arrayToJSON["+str(i)+"]["+str(arrayDimension-1)+ "] = " + str(arrayToJSON[i][arrayDimension - 1]) + "\033[0m" + "\n")
            arrayToJSON = corregirMatrizEstocastica(arrayToJSON, arrayDimension, i, arrayDimension - 1) 
            print("\033[93m" + "En usuario " + str(user_i) + " matriz nº " + str(array_i) + "\033[0m" + "\n")
            print("\033[93m" + "arrayToJSON["+str(i)+"]["+str(arrayDimension-1)+ "] = " + str(arrayToJSON[i][arrayDimension - 1]) + "\033[0m" + "\n")
    for j in range(arrayDimension):
        if(arrayToJSON[arrayDimension - 1][j] < 0):
            print("\033[92m" + "arrayToJSON["+str(arrayDimension-1)+"]["+str(j)+ "] = " + str(arrayToJSON[arrayDimension][j]) + "\033[0m" + "\n")
            arrayToJSON = corregirMatrizEstocastica(arrayToJSON, arrayDimension, arrayDimension - 1, j) 
            print("\033[92m" + "En usuario " + str(user_i) + " matriz nº " + str(array_i) + "\033[0m" + "\n")
            print("\033[92m" + "arrayToJSON["+str(arrayDimension-1)+"]["+str(j)+ "] = " + str(arrayToJSON[arrayDimension][j]) + "\033[0m" + "\n")

    return arrayToJSON

#Elimina elementos negativos en el arrayParam
#arrayParam = Todo el array pasado como parámetro
#row_pos = La fila en el que está colocado el elemento negativo
#column_pos = La columna en el que está colocado el elemento negativo
def corregirMatrizEstocastica(arrayParam, arrayDimension, row_pos, column_pos):
    print("Matriz antes de corregirse")
    imprimirArrayPorConsola(arrayParam, "94")
    borde = arrayDimension - 1
    max_row_pos = 0
    maximo = 0
    max_column_pos = 0
    correccionLocal = 0
    #Alterar la ultima fila para luego alterar las columnas
    #Incluyo el caso de que el elemento negativo sea el último del array, ya que es indiferente si es manejando la fila o columna
    if((row_pos == borde) or (row_pos == borde and column_pos == borde)):
        max_column_pos = 0
        #Buscamos el máximo de la última fila
        for i in range(arrayDimension):
            if(arrayParam[borde][i]) > maximo:
                maximo = arrayParam[borde][i]
                max_column_pos = i
        #Encontrado el maximo valor de la última fila, compensamos los elementos involucrados
        corregirValor = arrayParam[row_pos][column_pos]
        corregirValor = abs(corregirValor)
        print("\033[93m" + "CASO FILA U. corregirValor es: " + str(corregirValor) + "\033[0m")
        print("\033[93m" + "CASO FILA U. maximo es: " + str(maximo) + "\033[0m")
        print("\033[93m" + "CASO FILA U. max_column_pos es: " + str(max_column_pos) + "\033[0m")
        arrayParam[row_pos][column_pos] = arrayParam[row_pos][column_pos] + corregirValor    #Corregimos elemento negativo, se espera que dé cero
        arrayParam[borde][max_column_pos] = arrayParam[borde][max_column_pos] - corregirValor  #Compensamos éste elemento para que la última fila sea unitaria
        corregirValor = corregirValor/(arrayDimension - 1)
        #Modificamos las columnas afectadas por el cambio anterior, para que sigan sumando uno
        for i in range(arrayDimension - 1):
            if (arrayParam[i][column_pos] - corregirValor >= 0):
                arrayParam[i][max_column_pos] = arrayParam[i][max_column_pos] + corregirValor  #Compensamos la columna del elemento de máximo valor
                arrayParam[i][column_pos] = arrayParam[i][column_pos] - corregirValor  #Compensamos la columna del elemento negativo
                if((arrayParam[i][column_pos] - correccionLocal >= 0) and (correccionLocal != 0)):
                    arrayParam[i][max_column_pos] = arrayParam[i][max_column_pos] + correccionLocal  
                    arrayParam[i][column_pos] = arrayParam[i][column_pos] - correccionLocal
                    correccionLocal = 0
            else:
                correccionLocal += corregirValor

    #Alterar la ultima columna para luego alterar las filas
    elif(column_pos == borde):
        max_row_pos = 0
        #Buscamos el máximo de la última columna
        for i in range(arrayDimension):
            if(arrayParam[i][borde]) > maximo:
                maximo = arrayParam[i][borde]
                max_row_pos = i
        #Encontrado el maximo valor de la última columna, compensamos los elementos involucrados
        corregirValor = arrayParam[row_pos][column_pos]
        corregirValor = abs(corregirValor)
        print("\033[93m" + "CASO COLUMNA U. corregirValor es: " + str(corregirValor) + "\033[0m" + "\n")
        print("\033[93m" + "CASO COLUMNA U. maximo es: " + str(maximo) + "\033[0m" + "\n")
        print("\033[93m" + "CASO COLUMNA U. max_row_pos es: " + str(max_row_pos) + "\033[0m" + "\n")
        arrayParam[row_pos][column_pos] = arrayParam[row_pos][column_pos] + corregirValor    #Corregimos elemento negativo, se espera que dé cero 
        arrayParam[max_row_pos][borde] = arrayParam[max_row_pos][borde] - corregirValor  #Compensamos éste elemento para que la última fila sea unitaria
        corregirValor = corregirValor/(arrayDimension - 1)
        #Modificamos las columnas afectadas por el cambio anterior, para que sigan sumando uno
        for i in range(arrayDimension - 1):
            if (arrayParam[row_pos][i] - corregirValor >= 0):
                arrayParam[max_row_pos][i] = arrayParam[max_row_pos][i] + corregirValor  #Compensamos la columna del elemento de máximo valor
                arrayParam[row_pos][i] = arrayParam[row_pos][i] - corregirValor  #Compensamos la columna del elemento negativo
                if ((arrayParam[row_pos][i] - correccionLocal >= 0) and (correccionLocal != 0)):
                    arrayParam[max_row_pos][i] = arrayParam[max_row_pos][i] + correccionLocal
                    arrayParam[row_pos][i] = arrayParam[row_pos][i] - correccionLocal
                    correccionLocal = 0
            else:
                correccionLocal += corregirValor
    print("Matriz después de corregirse")
    imprimirArrayPorConsola(arrayParam, "95")
    print("\n")
    return arrayParam


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

    #Comprobamos si la última fila o columna del array tiene algún elemento negativo
    for i in range(arrayDimension):
        if(activityArray[i][arrayDimension - 1] < 0):
            print("\033[93m" + "-------------------------------------------------------------------------------" + "\033[0m" + "\n")
            print("\033[93m" + "activityArray["+str(i)+"]["+str(arrayDimension-1)+ "] = " + str(activityArray[i][arrayDimension - 1]) + "\033[0m" + "\n")
            activityArray = corregirMatrizEstocastica(activityArray, arrayDimension, i, arrayDimension - 1) 
            print("\033[93m" + "En usuario " + str(user_i) + " matriz nº " + str(array_i) + "\033[0m" + "\n")
            print("\033[93m" + "activityArray["+str(i)+"]["+str(arrayDimension-1)+ "] = " + str(activityArray[i][arrayDimension - 1]) + "\033[0m" + "\n")
    for j in range(arrayDimension):
        if(activityArray[arrayDimension - 1][j] < 0):
            print("\033[93m" + "-------------------------------------------------------------------------------" + "\033[0m" + "\n")
            print("\033[92m" + "activityArray["+str(arrayDimension-1)+"]["+str(j)+ "] = " + str(activityArray[arrayDimension - 1][j]) + "\033[0m" + "\n")
            activityArray = corregirMatrizEstocastica(activityArray, arrayDimension, arrayDimension - 1, j) 
            print("\033[92m" + "En usuario " + str(user_i) + " matriz nº " + str(array_i) + "\033[0m" + "\n")
            print("\033[92m" + "activityArray["+str(arrayDimension-1)+"]["+str(j)+ "] = " + str(activityArray[arrayDimension - 1][j]) + "\033[0m" + "\n")

    return activityArray

#INICIO DEL PROGRAMA TOTALLYRANDOMJSON.PY

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
    generateActiveTrueOrFalse = randrange(0, 2)
    if generateActiveTrueOrFalse >= 1:
        generateActiveTrueOrFalse = "true"
    else:
        generateActiveTrueOrFalse = "false"
    generatedJSONFile.write('\t' + '"active":' + generateActiveTrueOrFalse + ',' + '\n')
    generatedJSONFile.write('\t' + '"json_timestamp":"' + str(datetime.datetime.now()) + '",' + '\n')
    millis = time.time() * 1000 #da un float y las unidades son milisegundos
    generatedJSONFile.write('\t' + '"json_timestamp_epoch":"' + str(millis) + '",' + '\n')
    epochInfo = "json_timestamp_epoch is the time in milliseconds since the epoch as a floating point number. Epoch is designed to be January 1, 1970, 00:00:00 (UTC)"
    generatedJSONFile.write('\t' + '"json_timestamp_epoch_info":"' + epochInfo + '"' + '\n')
    generatedJSONFile.write('},\n')

    #Variable array/list que contiene todos los arrays de modelo de usuario
    listAllModelUserData = []
    #Bucle para escribir todos los modelos generados al JSON
    for array_i in range(arraysNum):
        arrayDimension = randrange(4, 10)
        #Generamos matriz estocástica para array_i
        arrayToJSON = generarMatrizEstocastica()
        print("Comprobando M. Estocástica de arrayToJSON \n")
        comprobarMatrizEstocastica(arrayToJSON)
        #Añadimos el modelo generado a la lista completa para el siguiente bucle de escribir las actividades
        listAllModelUserData.append(arrayToJSON)

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
    #Bucle para escribir todas las actividades de usuario en el JSON
    for array_i in range(arraysNum):
        #Extrameos segun el mismo orden del anterior array para extraer el correspondiente modelo para la actividad actual
        arrayToJSON = listAllModelUserData[array_i]
        arrayDimension = len(arrayToJSON) - 1
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

