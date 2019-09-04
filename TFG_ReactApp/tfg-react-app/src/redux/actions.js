export const GET_MONITORED_USERS = 'GET_MONITORED_USER';
export const GET_MONITORED_USER_DATA = 'GET_MONITORED_USER_DATA';
export const CHANGE_SENSITIVITY = 'CHANGE_SENSITIVITY';
export const SIMULATION_ON_OFF = 'SIMULATION_ON_OFF';

export function getMonitoredUsers(monitoredUsersObtained){
    return { type: GET_MONITORED_USERS, payload: {monitoredUsersObtained} };
}

export function getMonitoredUserData(monitoredUserData){
    return { type: GET_MONITORED_USER_DATA, payload: {monitoredUserData} };
}

export function changeSensitivity(sensitivityValue){
    return { type: CHANGE_SENSITIVITY, payload: {sensitivityValue} };
}

export function toggleSimulationAction(){
    return { type: SIMULATION_ON_OFF };
}

