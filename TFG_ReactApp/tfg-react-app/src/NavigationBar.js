import React from 'react';
import logo from './logo.svg';
import './NavigationBar.css';
import { connect } from 'react-redux';
import { onChangeSearch } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";

class NavigationBar extends React.Component{
    render(){
        /* Antigua barra de navegación
        <Route key={4} path="/" exact component={ 
                      () => <input key="searchBar" className="form-control form-control-dark w-100" type="text" 
                                placeholder="Search" aria-label="Search" 
                                value={this.props.search}
                                onChange={(e)=>{
                                    this.props.dispatch(onChangeSearch(e.target.value));
                                }
                            }/>
                    } 
                />
        */

        return[
            <nav key={1} className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                <img key={2} src={logo} className="App-logo" alt="logo"/>
                <Link key={3} to="/" className="companyName">Home</Link>
                <input key="searchBar" className="form-control form-control-dark w-100" type="text" 
                    placeholder="Search user" aria-label="Search" 
                    value={this.props.search}
                    onChange={(e)=>{
                        this.props.dispatch(onChangeSearch(e.target.value));
                    }
                }/>
                <ul key={6} className="navbar-nav px-3">
                    <li key={7} className="nav-item text-nowrap">
                    <Link key={8} className="nav-link" to="/">Login</Link>
                    </li>
                </ul>
            </nav>
        ];
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default (connect(mapStateToProps)(NavigationBar));