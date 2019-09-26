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
            active: true,
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

        var user_info = 0;
        fetch(urlTemp).then((response) => {return response.json()})
            .then( (monitoredJSON) => {
                user_info = monitoredJSON['user_info']; //obtiene un objeto que contiene la información de usuario, donde indica si está activo o no
                user_info = user_info['active'];    //obtiene el valor del campo JSON 'active'
                monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                if(this.state.isMounted){
                    this.setState({ models:monitoredJSON, active:user_info });
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
        //console.log("this.state.active del usuario " + monitoredUser + " es: ", this.state.active);

       //this.state.models obtiene un objeto tanto como activityUserData y modelUserData
        if (this.state.models !== undefined){
            Object.keys(this.state.models).forEach((monitoredJSONKey)=>{
                if(monitoredJSONKey.includes("modelUserData_")){
                    //Recopila todas las claves de diccionario 'modelUserData' y las guarda en arrayModelKeys
                    arrayModelKeys.push(monitoredJSONKey);
                }
            });
        }

        if(this.props.showActives){  //El personal de seguridad pide mostrar sólo los usuarios activos
            if(this.state.active){  //Entonces sólo se mostrarán los usuarios activos
                return(
                    <tr key={index}>
                    <td className="userName">{ monitoredUser }</td>
                    <td className="userModelPreviews">
                    <button key={monitoredUser} className="monitorModelsPreview" onClick= {
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
                            return <UserMonitor key={index} className="UserMonitor" 
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
                    </td>
                    </tr>
                );
            }else{
                return null;
            }
        }else{
            //Si el personal de seguridad no pide mostrar sólo usuarios activos, se mostrarán igualmente los usuarios no activos
            return(
                <tr key={index}>
                <td className="userName">{ monitoredUser }</td>
                <td className="userModelPreviews">
                <button key={monitoredUser} className="monitorModelsPreview" onClick= {
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
                        return <UserMonitor key={index} className="UserMonitor" 
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
                </td>
                </tr>
            );
        }
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewModels));
