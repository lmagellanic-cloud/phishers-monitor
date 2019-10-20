import sqlite3

pathToMonitoredUsers = './databases/monitoredUsers/monitoredUsers.db'

def add_monitoredUser(username, jsonFile):
    try:
        with sqlite3.connect(pathToMonitoredUsers) as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO monitoredUsers (username, jsonFile) values (?, ?, ?);
                """, (username, jsonFile,))
            result = {'status': 1, 'message': 'monitoredUser added'}
    except:
        result = {'status': 0, 'message': 'Error inserting monitoredUser'}
    return result

def get_all_monitoredUsers():
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM monitoredUsers ORDER BY id desc")
        all_monitoredUsers = cursor.fetchall()
        return all_monitoredUsers

def get_all_onlyNamesMonitoredUsers():
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT monitoredUser FROM monitoredUsers ORDER BY id desc")
        all_monitoredUsers = cursor.fetchall()
        return all_monitoredUsers

def get_monitoredUser(monitoredUser_id):
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM monitoredUsers WHERE id = ?", (monitoredUser_id,))
        monitoredUserSelected = cursor.fetchone()
        return monitoredUserSelected

def get_monitoredUserByName(monitoredUserName):
    with sqlite3.connect(pathToMonitoredUsers) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM monitoredUsers WHERE monitoredUser = ?", (monitoredUserName,))
        monitoredUserSelected = cursor.fetchone()
        return monitoredUserSelected

#monitoredUserName: El nombre de usuario registrado en la tabla de datos, normalmente el mismo que el nombre del fichero JSON
#monitoredJSON: Todo el contenido JSON leido como una cadena de string
def update_monitoredUserByName(monitoredUserName, monitoredJSON):
    try:
        sqliteConnection = sqlite3.connect(pathToMonitoredUsers)
        cursor = sqliteConnection.cursor()
        print("Connected to SQLite")

        id = get_monitoredUserByName(monitoredUserName)
        id = id[0]  #id del resultado de la petición SQL de get_monitoredUSerByName
        sql_update_query = """UPDATE monitoredUsers SET monitoredJSON = ? WHERE id = ?"""
        data = (monitoredJSON, id)
        cursor.execute(sql_update_query, data)
        result = sqliteConnection.commit()
        print("\033[92m" + "Record Updated successfully with user: " + str(monitoredUserName) + "\033[0m" +  "\n")
        cursor.close()

    except sqlite3.Error as error:
        print("\033[92m" + "Failed to update sqlite table" + "\033[0m", error)
    finally:
        if (sqliteConnection):
            sqliteConnection.close()
            print("The SQLite connection is closed")
