import React from 'react';
import './SideBar.css';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { toggleSimulationAction, toggleShowActives } from './redux/actions';
import { connect } from 'react-redux';

class SideBar extends React.Component {

    onClickToggleSimulation(){
        //console.log("this.props.simulation antes disparar el botón",this.props.simulation);
        this.props.dispatch(toggleSimulationAction());
    }

    onClickToggleShowActives(){
        //console.log("this.props.showActives es: ", this.props.showActives);
        this.props.dispatch(toggleShowActives());
    }

    render(){
        return(
            <nav className="col-md-2 d-none d-md-block bg-light sidebar">
                <div className="sidebar-sticky SideBar">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                <span data-feather="home"></span>
                                Monitored Users <span className="sr-only">(current)</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="http://localhost:5000/">
                                <span data-feather="fileJSON"></span>
                                Go to JSON provider
                            </a>
                        </li>
                        <li className="field check-round slide">
                            <input type="checkbox" name="check-slide" id="check-slide" 
                            onClick= {() =>{this.onClickToggleSimulation()}}/>
                            <label htmlFor="check-slide">Simulation on/off <span></span></label>
                        </li>
                        <li className="field check-round slide">
                            <input type="checkbox" name="check-slide-showActives" id="check-slide-showActives" 
                            onClick= {() =>{this.onClickToggleShowActives()}}/>
                            <label htmlFor="check-slide-showActives">Only show active users <span></span></label>
                        </li>
                    </ul>
                </div>
            </nav>
        );
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default connect(mapStateToProps)(SideBar);