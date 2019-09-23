import React from 'react';
import UserMonitor from './UserMonitor';
import { connect } from 'react-redux';
import { getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";


class PreviewActivities extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activities : [{}],
            isMounted: true
        };
      }

    componentDidMount(){
        this.state.isMounted = true;
        var getAllSelectedActivitiesByIndex = []  //Los arrays de los datos según actividad
        this.props.monitoredUsers.map((monitoredUser)=>{
            var urlTemp = urlUserData + monitoredUser;
            console.log("Fetch to: ", urlTemp);

            fetch(urlTemp).then((response) => {return response.json()})
                .then( (monitoredJSON) => {
                    monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                    //Desglosamos el objeto Object de monitoredJSON
                    if (monitoredJSON !== undefined){
                        Object.keys(monitoredJSON).forEach((monitoredJSONKey)=>{
                            //this.props.index es el nombre de la actividad. Viene de selectedKeyOfObject de By_applications.js
                            if(monitoredJSONKey.includes(this.props.index)){
                                getAllSelectedActivitiesByIndex.push(monitoredJSON[monitoredJSONKey]);
                            }
                        });
                    }
            });
        });
        if(this.state.isMounted){
            //activities es un array que almacena arrays de activityUserData
            console.log("getAllSelectedActivitiesByIndex es: ", getAllSelectedActivitiesByIndex);
            this.setState({ activities:getAllSelectedActivitiesByIndex });
        }
    }

    componentWillUnmount(){
        this.state.isMounted = false;
    }

    render(){
        var index = this.props.index;

        if(this.state.activities != undefined){
            return(
                <div>
                    {
                        //El index de monitoredUsers es el mismo que el de this.props.activities
                        this.props.monitoredUsers.map((monitoredUser, index_button)=>{
                            console.log("this.state.activities en render es: ", this.state.activities);
                            console.log("this.state.activities[index_button] con index_button " + index_button + " es: ", this.state.activities[index_button]);
                            var temporal = this.state.activities;
                            temporal.map((arraySeleccionado)=>{
                                console.log("arraySeleccionado es: ", arraySeleccionado);
                            });
                            return(
                                "Hola"
                                /*
                                <UserMonitor 
                                doSensitivity={false} 
                                tipoCanvas={"activityTd"} 
                                index={ index } 
                                widthCSS = { 5 }
                                heightCSS = { 5 }
                                data={ this.state.activities[index_button] } 
                                key={index_button} 
                                className="monitorPreview" 
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
                                </UserMonitor>
                                */
                            );
                        })
                    }
                </div>
            );
        }else{
            return "Cargando datos";
        }
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewActivities));
