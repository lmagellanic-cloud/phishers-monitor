import os
import sqlite3
import json

pathToMonitoredUsers = os.getcwd() + '/TFG/databases/monitoredUsers/monitoredUsers.db'
pathToJSON = os.getcwd() + '/TFG/generatedJSON'

def drop_table():
    print("\npathToMonitoredUsers es: " + pathToMonitoredUsers + "\n")
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        c = connection.cursor()
        c.execute("""DROP TABLE IF EXISTS monitoredUsers;""")
        print("monitoredUsers database table removed")
    return True


def create_db():
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        c = connection.cursor()
        table = """CREATE TABLE monitoredUsers(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monitoredUser TEXT NOT NULL,
            monitoredJSON TEXT NOT NULL
        );
        """
        c.execute(table)
        print("monitoredUsers database table created \n")
    return True

def initialize_db():
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        cursor = connection.cursor()
        for filename in sorted(os.listdir(pathToJSON)):
            if filename.endswith(".json"): 
                monitoredUser = filename.strip(".json")
                monitoredJSON = json.load(open(pathToJSON + os.sep + filename, "r+"))
                monitoredJSON = str(monitoredJSON)
                #print(monitoredJSON)
                cursor.execute("""INSERT INTO monitoredUsers (monitoredUser, monitoredJSON) values (?, ?); """, 
                (monitoredUser, monitoredJSON,))
                print("Se ha insertado " + monitoredUser + "\n")
        

if __name__ == '__main__':
    try:
        drop_table()
        create_db()
        initialize_db()
    except:
        pathToMonitoredUsers = os.getcwd() + '/databases/monitoredUsers/monitoredUsers.db'
        pathToJSON = os.getcwd() + '/generatedJSON'
        drop_table()
        create_db()
        initialize_db()