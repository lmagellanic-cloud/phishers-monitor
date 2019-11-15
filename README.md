# phishers-monitor
Web platform that facilitates the visual analysis of user behavior in interactive systems to determine their identity, through the provision of JSON files.

### Prerequisites

* [Python 3]
* [Node.js]
* [Yarn]

#### Unix distributions 
It is recommended to use the "curl" command to install the prerequisites with the following commands:
```
$ sudo apt-get update
$ sudo apt-get install python3.6
$ sudo apt install curl
$ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get install yarn
$ sudo apt-get install python3-pip
```

## Getting Started

#### Unix distributions 

Open the terminal and clone the repository with the following commands:
```
$ git clone https://github.com/lmagellanic-cloud/phishers-monitor.git
$ cd phishers-monitor/
```

File "monitoredUsers.db" in TFG/databases/monitoredUsers/ is needed to run the Flask server:
```
$ touch TFG/databases/monitoredUsers/monitoredUsers.db 
```

Install the necessary dependencies for the Flask server:
```
$ pip3 install -r TFG/requirements.txt
```

Generate JSON files with the script generateTotallyRandomJSON.py and add them to the database (You can also use generateDesiredJSON.py file):
```
$ python3 TFG/generateTotallyRandomJSON.py 
$ python3 TFG/create_and_insert_JSON_to_DB.py 
```

Install the necessary dependencies for the React server:
```
$ cd TFG_ReactApp/tfg-react-app/
$ yarn install
```

And run the Flask server (localhost:5000) and React server (localhost:3000):
Reloads the page localhost:5000 if it doesn't work at the first attempt.
```
$ chmod 700 TFG/runTFG.sh 
$ chmod 700 TFG_ReactApp/tfg-react-app/runTFG_ReactApp.sh 
$ cd TFG/ 
$ ./runTFG.sh
```
Open a new terminal in phishers-monitor/:
```
$ cd TFG_ReactApp/tfg-react-app/
$ ./runTFG_ReactApp.sh 
```

## License

This project is licensed under the Apache License 2.0 (Version 2.0, January 2004)- see the [LICENSE.md](LICENSE.md) file for details
