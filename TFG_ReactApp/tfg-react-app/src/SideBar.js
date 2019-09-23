import React from 'react';
import './SideBar.css';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { toggleSimulationAction } from './redux/actions';
import { connect } from 'react-redux';

class SideBar extends React.Component {
    constructor(props) {
        super(props);
        this.toggleSimulationButton = React.createRef();
    }

    onClickToggleSimulation(){
        console.log("this.props.simulation antes disparar el botón",this.props.simulation);
        this.props.dispatch(toggleSimulationAction());
    }

    render(){
        return(
            <nav className="col-md-2 d-none d-md-block bg-light sidebar">
                <div className="sidebar-sticky SideBar">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                <span data-feather="home"></span>
                                Usuarios monitorizados <span className="sr-only">(current)</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                <span data-feather="fileJSON"></span>
                                Gestionar JSON
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                <span data-feather="about"></span>
                                About
                            </Link>
                        </li>
                        <li className="field check-round slide">
                            <input type="checkbox" name="check-slide" id="check-slide" 
                            onClick= {() =>{this.onClickToggleSimulation()}}/>
                            <label htmlFor="check-slide">Simulation on/off <span></span></label>
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