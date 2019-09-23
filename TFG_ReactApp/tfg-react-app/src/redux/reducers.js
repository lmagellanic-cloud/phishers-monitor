import { combineReducers } from 'redux';
import { GET_MONITORED_USERS, GET_MONITORED_USER_DATA, 
    CHANGE_SENSITIVITY, SIMULATION_ON_OFF, BY_ALL_MODELS, BY_APPLICATION } from './actions';

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

const GlobalState = (combineReducers({
    monitoredUsers,
    monitoredUserData,
    sensitivity,
    simulation,
    orderBy
}));

export default GlobalState;