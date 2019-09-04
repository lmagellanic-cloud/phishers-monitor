import React from 'react';
import logo from './logo.svg';
import './NavigationBar.css';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";

export default class NavigationBar extends React.Component{
    render(){
        return[
            <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                <img src={logo} className="App-logo" alt="logo"/>
                <Link to="/" className="companyName">Home</Link>
                <Route path="/" exact component={ 
                      () => <input className="form-control form-control-dark w-100" type="text" placeholder="Search" aria-label="Search"/>
                    } 
                />
                <Route path="/monitoredUser/:id" component={ 
                      () => 
                        <div className="w-100"></div>
                    } 
                />
                <ul className="navbar-nav px-3">
                    <li className="nav-item text-nowrap">
                    <Link className="nav-link" to="/">Login</Link>
                    </li>
                </ul>
            </nav>
        ];
    }
}