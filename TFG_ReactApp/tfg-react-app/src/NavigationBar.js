import React from 'react';
import logo from './logo.svg';
import './NavigationBar.css';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";

export default class NavigationBar extends React.Component{
    render(){
        return[
            <nav key={1} className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                <img key={2} src={logo} className="App-logo" alt="logo"/>
                <Link key={3} to="/" className="companyName">Home</Link>
                <Route key={4} path="/" exact component={ 
                      () => <input className="form-control form-control-dark w-100" type="text" placeholder="Search" aria-label="Search"/>
                    } 
                />
                <Route key={5} path="/monitoredUser/:id" component={ 
                      () => 
                        <div className="w-100"></div>
                    } 
                />
                <ul key={6} className="navbar-nav px-3">
                    <li key={7} className="nav-item text-nowrap">
                    <Link key={8} className="nav-link" to="/">Login</Link>
                    </li>
                </ul>
            </nav>
        ];
    }
}