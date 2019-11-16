import { combineReducers } from 'redux';
import { GET_MONITORED_USERS, GET_MONITORED_USER_DATA, 
    CHANGE_SENSITIVITY, SIMULATION_ON_OFF, BY_ALL_MODELS, BY_APPLICATION, SHOW_ACTIVES_ON_OFF,
     ON_CHANGE_SEARHC, REQUEST_NEW_DATA, CHANGE_ALARM_TRESHOLD} from './actions';

function monitoredUsers(state = [], action={}){
    switch(action.type){
        case GET_MONITORED_USERS: 
            return action.payload.monitoredUsersObtained;
        default:
            return state;
    }
}

function monitoredUserData(state = [], action={}){
    switch(action.type){
        case GET_MONITORED_USER_DATA:
            return action.payload.monitoredUserData;
        default:
            return state;
    }
}

function sensitivity(state = [], action={}){
    switch(action.type){
        case CHANGE_SENSITIVITY:
            return action.payload.sensitivityValue;
        default:
            return state;
    }
}

function simulation(state = [], action={}){
    switch(action.type){
        case SIMULATION_ON_OFF:
            return !state;
        default:
            return state;
    }
}

function orderBy(state = [], action={}){
    switch(action.type){
        case BY_ALL_MODELS:
            return action.type;
        case BY_APPLICATION:
            return action.type;
        default:
            return state;
    }
}

function showActives(state = [], action={}){
    switch(action.type){
        case SHOW_ACTIVES_ON_OFF:
            return !state;
        default:
            return state;
    }
}

function search(state = [], action={}){
    switch(action.type){
        case ON_CHANGE_SEARHC:
            return action.payload;
        default:
            return state;
    }
}

function requestNewData(state = [], action= {}){
    switch(action.type){
        case REQUEST_NEW_DATA:
            return action.payload;
        default:
            return state;
    }
}

function alarmTreshold(state = [], action = {}){
    switch(action.type){
        case CHANGE_ALARM_TRESHOLD:
            return action.payload;
        default:
            return state;
    }
}

const GlobalState = (combineReducers({
    monitoredUsers,
    monitoredUserData,
    sensitivity,
    simulation,
    orderBy,
    showActives,
    search,
    requestNewData,
    alarmTreshold
}));

export default GlobalState;