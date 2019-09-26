# phishers-monitor
Plataforma web que facilita el análisis visual del comportamiento de usuarios en sistemas interactivos para determinar su identidad, mediante suministro de ficheros JSON.

### Prerequisites

* [Python 3]
* [Node.js]
* [Yarn]

#### Linux dist. 
Se recomienda utilizar el comando "curl" para instalar los prerequisitos con las siguientes líneas:
```
$ sudo apt-get update
$ sudo apt-get install python3.6
$ sudo apt install curl
$ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get install yarn
```

## Getting Started

#### Linux dist. 

Abre el terminal y clonas el repositorio con el siguiente comando:
```
git clone https://github.com/lmagellanic-cloud/phishers-monitor.git
```

Se necesita fichero "monitoredUsers.db" en TFG/databases/monitoredUsers/ para poder funcionar el servidor Flask:
```
cd phishers-monitor/TFG/databases/monitoredUsers/
touch monitoredUsers.db
```

Instala las dependencias necesarias para el servidor de Flask (~/TFG):
```
$ pip3 install -r requirements.txt
```

Genera ficheros JSON con el script generateDesiredJSON.py y añádelos a la base de datos con:
```
python3 generateDesiredJSON.py 
python3 create_and_insert_JSON_to_DB.py 
```
Si no deseas introducir ningún dato nada más que el número de usuarios, puedes usar los siguientes comandos:
```
python3 generateTotallyRandomJSON.py 
python3 create_and_insert_JSON_to_DB.py 
```

Y ejecuta los dos servidores Flask (localhost:5000) y Node.js (localhost:3000):
Recarga la página localhost:5000 si no sale a la primera.
```
chmod 700 TFG/runTFG.sh 
chmod 700 TFG_ReactApp/tfg-react-app/runTFG_ReactApp.sh 
./TFG/runTFG.sh 
```
En una nueva terminal:
```
cd TFG_ReactApp/tfg-react-app/
./runTFG_ReactApp.sh 
```

## License

This project is licensed under the Apache License 2.0 (Version 2.0, January 2004)- see the [LICENSE.md](LICENSE.md) file for details
