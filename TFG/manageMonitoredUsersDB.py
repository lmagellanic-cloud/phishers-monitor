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