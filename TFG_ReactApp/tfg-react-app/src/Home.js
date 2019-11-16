import React from 'react';
import './Home.css';
import MonitoredUsersList from './MonitoredUsersList';

export default class Home extends React.Component {
    render(){
        return(
            <main id="Home" role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Monitored users</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        
                    </div>
                </div>
                <MonitoredUsersList/>
            </main>
        );
    }
}