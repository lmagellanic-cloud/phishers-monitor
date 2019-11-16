import React from 'react';
import UserMonitor from './UserMonitor';
import { connect } from 'react-redux';
import { getMonitoredUserData, requestNewData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";


class PreviewActivities extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activities : null,
            pointer: null,
            active: true,
            isMounted: true
        };
    }

    checkIfUserShouldBeRequested(monitoredUser, isActive){
        var showPreviewModel = true; //Renderizar o no
        if(this.props.showActives){  //El personal de seguridad pide mostrar sólo los usuarios activos
            if(isActive){  
                    //Mostrar si el usuario no está activo
                    showPreviewModel = true;
            }else{
                //No mostrar si el usuario no está activo
                showPreviewModel = false;
            }
        }

        if(this.props.search != ""){
            if(monitoredUser.includes(this.props.search)){
                //Mostrar cuando search no es nulo y coincide con monitoredUser
                showPreviewModel = true;
                if(this.props.showActives){  //El personal de seguridad pide mostrar sólo los usuarios activos
                    if(isActive){  
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
        if(this.props.requestNewData){
            this.props.dispatch(requestNewData(false));
            //this.forceUpdate();
        }
        this.state.isMounted = true;
        var pointerOfMonitoredUser = [];
        var getAllSelectedActivitiesByIndex = []  //Los arrays de los datos según actividad
        var getAllActives = []
        this.props.monitoredUsers.map((monitoredUser)=>{
            var urlTemp = urlUserData + monitoredUser;
            var showPreviewModel = this.checkIfUserShouldBeRequested(monitoredUser, true);

            if(showPreviewModel){
                fetch(urlTemp).then((response) => {return response.json()})
                    .then( (monitoredJSON) => {
                        var user_info = monitoredJSON['user_info']; //obtiene un objeto que contiene la información de usuario, donde indica si está activo o no
                        user_info = user_info['active'];    //obtiene el valor del campo JSON 'active'
                        monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                        //Desglosamos el objeto Object de monitoredJSON
                        if (monitoredJSON !== undefined){
                            Object.keys(monitoredJSON).forEach((monitoredJSONKey)=>{
                                //this.props.index es el nombre de la actividad. Viene de selectedKeyOfObject de By_applications.js
                                if(monitoredJSONKey.includes(this.props.index)){
                                    getAllSelectedActivitiesByIndex.push(monitoredJSON[monitoredJSONKey]);
                                    pointerOfMonitoredUser.push(monitoredUser);
                                    getAllActives.push(user_info);
                                    if(this.state.isMounted){
                                        //activities es un array que almacena arrays de activityUserData
                                        this.setState({ activities:getAllSelectedActivitiesByIndex, pointer: pointerOfMonitoredUser, active:getAllActives});
                                    }
                                }
                            });
                        }
                });
            }
        });
    }

    componentWillUnmount(){
        this.state.isMounted = false;
    }

    render(){
        var index = this.props.index;

        if(this.state.activities != undefined){
            return(
                <div className="divByActivity">
                    {
                        //El index de monitoredUsers es el mismo que el de this.props.activities
                        this.state.pointer.map((monitoredUser, index_button)=>{
                            if(this.state.activities[index_button] != undefined){
                                var isActive = this.state.active[index_button];
                                var showPreviewModel = this.checkIfUserShouldBeRequested(monitoredUser, isActive);
                                if(showPreviewModel){
                                    return(
                                        <button key={monitoredUser} className="monitorActivityPreview" 
                                        onClick={
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
                                            {monitoredUser}
                                            <UserMonitor 
                                            doSensitivity={false} 
                                            tipoCanvas={"activityTd"} 
                                            index={ index_button } 
                                            widthCSS = { 75 }
                                            heightCSS = { 75 }
                                            data={ this.state.activities[index_button] } 
                                            key={index_button} 
                                            >
                                            </UserMonitor>
                                        </button>
                                        );
                                }else{
                                    return null;
                                }
                            }else{
                                return "Loading..."
                            }
                        })
                    }
                </div>
            );
        }else{
            return "Loading...";
        }
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewActivities));
