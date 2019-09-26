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

    checkIfUserShouldBeRequested(){
        var showPreviewModel = true; //Renderizar o no
        if(this.props.showActives){  //El personal de seguridad pide mostrar sólo los usuarios activos
            if(this.state.active){  
                    //Mostrar si el usuario no está activo
                    showPreviewModel = true;
            }else{
                //No mostrar si el usuario no está activo
                showPreviewModel = false;
            }
        }

        if(this.props.search != ""){
            if(this.props.monitoredUser.includes(this.props.search)){
                //Mostrar cuando search no es nulo y coincide con monitoredUser
                showPreviewModel = true;
                if(this.props.showActives){  //El personal de seguridad pide mostrar sólo los usuarios activos
                    if(this.state.active){  
                            //Mostrar si el usuario no está activo
                            showPreviewModel = true;
                    }else{
                        //No mostrar si el usuario no está activo
                        showPreviewModel = false;
                    }
                }
            }else{
                //Que en caso contrario no se mostraría
                showPreviewModel = false;
            }
        }
        return showPreviewModel;
    }

    componentDidMount(){
        var showPreviewModel = this.checkIfUserShouldBeRequested();
        this.state.isMounted = true;
        var monitoredUser = this.props.monitoredUser;   //Nombre del usuario
        if(monitoredUser.includes("monitoredUser_")){
            return;
        }
        var urlTemp = urlUserData + monitoredUser;
        //console.log("Fetch to: ", urlTemp);
    
        //Realizar petición sólo si se requiere que se muestre
        var user_info = 0;
        if(showPreviewModel){
            fetch(urlTemp).then((response) => {return response.json()})
                .then( (monitoredJSON) => {
                    user_info = monitoredJSON['user_info']; //obtiene un objeto que contiene la información de usuario, donde indica si está activo o no
                    user_info = user_info['active'];    //obtiene el valor del campo JSON 'active'
                    monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                    if(this.state.isMounted){
                        this.setState({ models:monitoredJSON, active:user_info });
                    }
            });
        }
    }

    componentWillUnmount(){
        this.state.isMounted = false;
    }

    render(){
        var index = this.props.index;
        var arrayModelKeys = [];
        var monitoredUser = this.props.monitoredUser;   //Nombre del usuario
        var showPreviewModel = this.checkIfUserShouldBeRequested();

       //this.state.models obtiene un objeto tanto como activityUserData y modelUserData
        if (this.state.models !== undefined){
            Object.keys(this.state.models).forEach((monitoredJSONKey)=>{
                if(monitoredJSONKey.includes("modelUserData_")){
                    //Recopila todas las claves de diccionario 'modelUserData' y las guarda en arrayModelKeys
                    arrayModelKeys.push(monitoredJSONKey);
                }
            });
        }

        if(showPreviewModel){
            //Renderizar sólo si se requiere que se muestre
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
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewModels));
