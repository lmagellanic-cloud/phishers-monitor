import React from 'react';
import UserMonitor from './UserMonitor';
import { connect } from 'react-redux';
import { getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";


class PreviewActivities extends React.Component {

    getAllUserActivitiesFromSelectedActivity(){
        var getAllSelectedActivitiesByIndex = []  //Los arrays de los datos según actividad
        this.props.monitoredUsers.map((monitoredUser, index_button)=>{
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
        console.log("getAllSelectedActivitiesByIndex antes de devolver es: ", getAllSelectedActivitiesByIndex);
        console.log("getAllSelectedActivitiesByIndex[0] antes de devolver es: ", getAllSelectedActivitiesByIndex[0]);
    }

    render(){
        return(
            <div>
                {
                    this.getAllUserActivitiesFromSelectedActivity()
                        /*
                        return(
                            <UserMonitor 
                            doSensitivity={false} 
                            tipoCanvas={"activityTd"} 
                            index={ index } 
                            widthCSS = { 5 }
                            heightCSS = { 5 }
                            data={ monitoredUser[index] } 
                            key={index} 
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
                        );
                        */
                }
            </div>
        );
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(PreviewActivities));
