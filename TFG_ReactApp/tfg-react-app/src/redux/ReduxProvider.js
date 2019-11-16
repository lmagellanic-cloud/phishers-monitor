import { Provider } from 'react-redux';
import GlobalState from './reducers';
import { createStore } from 'redux';

import React from 'react';
import App from '../App';
import { BY_ALL_MODELS } from './actions';

export default class ReduxProvider extends React.Component {
    constructor(props){
        super(props);
        this.initialState = { 
            monitoredUsers: [
                "monitoredUser_1",
                "monitoredUser_2",
                "monitoredUser_3",
                "monitoredUser_4",
                "monitoredUser_5"
            ],
            monitoredUserData: "{ 'example': 'example' }",
            sensitivity: 5, 
            simulation: false,
            orderBy: BY_ALL_MODELS,
            showActives: false, 
            search: "",
            requestNewData: false,
            alarmTreshold: 10
        };
        this.store = this.configureStore();
    }

    render(){
        return(
            <Provider store={ this.store }>
                <div style={{ height: '100%' }}>
                    <App store={ this.store }/>
                </div>
            </Provider>
        );
    }

    configureStore(){
        return createStore(GlobalState, this.initialState);
    }
}
