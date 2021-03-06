export const GET_MONITORED_USERS = 'GET_MONITORED_USER';
export const GET_MONITORED_USER_DATA = 'GET_MONITORED_USER_DATA';
export const CHANGE_SENSITIVITY = 'CHANGE_SENSITIVITY';
export const SIMULATION_ON_OFF = 'SIMULATION_ON_OFF';
export const BY_ALL_MODELS = "BY_ALL_MODELS";
export const BY_APPLICATION = "BY_APPLICATION";
export const SHOW_ACTIVES_ON_OFF = "SHOW_ACTIVES_ON_OFF";
export const ON_CHANGE_SEARHC = "ON_CHANGE_SEARCH";
export const REQUEST_NEW_DATA = "REQUEST_NEW_DATA";
export const CHANGE_ALARM_TRESHOLD = "CHANGE_ALARM_TRESHOLD";

/*
Esta función es sólamente para la obtención de los nombres de los usuarios y no sus datos.
*/
export function getMonitoredUsers(monitoredUsersObtained){
    return { type: GET_MONITORED_USERS, payload: {monitoredUsersObtained} };
}

/*
Esta función obtiene los datos de un usuario seleccionado
*/
export function getMonitoredUserData(monitoredUserData){
    return { type: GET_MONITORED_USER_DATA, payload: {monitoredUserData} };
}

export function changeSensitivity(sensitivityValue){
    return { type: CHANGE_SENSITIVITY, payload: {sensitivityValue} };
}

export function toggleSimulationAction(){
    return { type: SIMULATION_ON_OFF };
}

export function setOrderBy(orderChoice){
    switch(orderChoice){
        case BY_ALL_MODELS: return { type: BY_ALL_MODELS };
        case BY_APPLICATION: return { type: BY_APPLICATION };
        default: return { type: BY_ALL_MODELS };
    }
}

export function toggleShowActives(){
    return { type: SHOW_ACTIVES_ON_OFF };
}

export function onChangeSearch(index){
    return { type: ON_CHANGE_SEARHC, payload: index };
}

export function requestNewData(value){
    return {type: REQUEST_NEW_DATA, payload: value };
}

export function changeAlarmTreshold(value){
    //treshold must be an entire number in range of 0-100
    if(value === null){
        value = 10;
    }
    /* if(value === ""){
        value = 10;
    } */
    if(value < 0){
        value = 0;
    }
    if (value > 100){
        value = 100;
    }
    //console.log(value);
    return {type: CHANGE_ALARM_TRESHOLD, payload: value};
}
