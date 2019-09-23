import React from 'react';
import UserMonitor from './UserMonitor';
import { connect } from 'react-redux';
import { getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";


class PreviewModels extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            models : undefined,
            isMounted: true
        };
      }

    componentDidMount(){
        this.state.isMounted = true;
        var monitoredUser = this.props.monitoredUser;   //Nombre del usuario
        if(monitoredUser.includes("monitoredUser_")){
            return;
        }
        var urlTemp = urlUserData + monitoredUser;
        //console.log("Fetch to: ", urlTemp);

        fetch(urlTemp).then((response) => {return response.json()})
            .then( (monitoredJSON) => {
                monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                if(this.state.isMounted){
                    this.setState({ models:monitoredJSON });
                }
        });
        //console.log("monitoredJSON al realizar fetch en " + monitoredUser + " es: ", this.state.models);
    }

    componentWillUnmount(){
        this.state.isMounted = false;
    }

    render(){
        var index = this.props.index;
        var arrayModelKeys = [];
        var monitoredUser = this.props.monitoredUser;   //Nombre del usuario
       //console.log("Al renderizar el PreviewModels de "+ monitoredUser + " this.state.models es: ", this.state.models);

       //this.state.models obtiene un objeto tanto como activityUserData y modelUserData
        if (this.state.models !== undefined){
            Object.keys(this.state.models).forEach((monitoredJSONKey)=>{
                if(monitoredJSONKey.includes("modelUserData_")){
                    //Recopila todas las claves de diccionario 'modelUserData' y las guarda en arrayModelKeys
                    arrayModelKeys.push(monitoredJSONKey);
                }
            });
        }

        return(
            <button key={monitoredUser} className="monitorPreview" onClick= {
                () => {
                    var urlTemp = urlUserData + monitoredUser;
                    if(this.props.simulation){
                        urlTemp = urlTemp + "?simulation=1";
                    }
                    fetch(urlTemp).then((response) => {return response.json()})
                        .then( (data) => {
                        this.props.dispatch(getMonitoredUserData(data));
                        this.props.history.push("/monitoredUser/" + monitoredUser);
                    });
                }
            }>
            {
                arrayModelKeys.map((key_3, index) => {
                    var row_i = key_3.slice(-1);
                    //console.log("Los datos de usuario " + monitoredUser + " para preview es: ", this.state.models["modelUserData_" + row_i] )
                    return <UserMonitor className="UserMonitor" 
                        doSensitivity={false} tipoCanvas={"modelTd"} 
                        index={ index } 
                        widthCSS = { 5 }
                        heightCSS = { 5 }
                        data={ this.state.models["modelUserData_" + row_i] } 
                    >
                    </UserMonitor>
                })
            }
            </button>
        );
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewModels));
