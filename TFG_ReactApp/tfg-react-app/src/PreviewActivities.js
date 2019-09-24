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
            activities : null,
            isMounted: true
        };
      }

    componentDidMount(){
        this.state.isMounted = true;
        var getAllSelectedActivitiesByIndex = []  //Los arrays de los datos según actividad
        this.props.monitoredUsers.map((monitoredUser)=>{
            var urlTemp = urlUserData + monitoredUser;

            fetch(urlTemp).then((response) => {return response.json()})
                .then( (monitoredJSON) => {
                    monitoredJSON = monitoredJSON['monitoredJSON']; //obtiene un objeto tanto como activityUserData y modelUserData
                    //Desglosamos el objeto Object de monitoredJSON
                    if (monitoredJSON !== undefined){
                        Object.keys(monitoredJSON).forEach((monitoredJSONKey)=>{
                            //this.props.index es el nombre de la actividad. Viene de selectedKeyOfObject de By_applications.js
                            if(monitoredJSONKey.includes(this.props.index)){
                                getAllSelectedActivitiesByIndex.push(monitoredJSON[monitoredJSONKey]);
                                if(this.state.isMounted){
                                    //activities es un array que almacena arrays de activityUserData
                                    this.setState({ activities:getAllSelectedActivitiesByIndex });
                                }
                            }
                        });
                    }
            });
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
                        this.props.monitoredUsers.map((monitoredUser, index_button)=>{
                            //console.log("this.state.activities en render es: ", this.state.activities);
                            console.log("this.state.activities[" + index_button + "] es: ", this.state.activities[index_button]);
                            if(this.state.activities[index_button] != undefined){
                                console.log("this.state.activities dentro del return es: ", this.state.activities);
                                /*
                                return <UserMonitor key={monitoredUser} className="UserMonitor" 
                                    doSensitivity={false} tipoCanvas={"modelTd"} 
                                    index={ index } 
                                    widthCSS = { 5 }
                                    heightCSS = { 5 }
                                    data={ this.state.activities[index_button] } 
                                >
                                </UserMonitor>
                                */

                                return(
                                    <button className="monitorPreview" 
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
                                return "Cargando datos"
                            }
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
