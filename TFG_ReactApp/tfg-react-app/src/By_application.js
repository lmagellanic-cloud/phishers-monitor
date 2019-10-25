import React from 'react';
import './By_application.css';
import PreviewActivities from './PreviewActivities';
import { connect } from 'react-redux';
import { withRouter } from "react-router-dom";

class By_application extends React.Component {

    desplegateAllActivities(){
        //Es suficiente con uno de los usuarios monitorizados para extraer el número de actividades
        var numActivities = this.props.monitoredUserData["monitoredJSON"]; //Accede a la clave monitoredJSON donde está modelUserData y activityUserData.
        //Recorre numActivities, que es un objeto Object, para contar el numero de actividades
        var numeroTemporal = []
        if (numActivities !== undefined){
            Object.keys(numActivities).forEach((selectedKeyOfObject)=>{
                if(selectedKeyOfObject.includes("activityUserData_")){
                    //Cuenta todas las claves de diccionario 'activityUserData'
                    numeroTemporal.push(selectedKeyOfObject);
                }
            });
        }
        return numeroTemporal;
    }

    render(){
        return(
            <div className="table-responsive">
            <table className="table table-sm">
                <thead>
                <tr>
                    <th className="text-center applicationTh">Service</th>
                    <th className="text-center userActivityPreviewsTh">Activity Previews</th>
                </tr>
                </thead>
                <tbody className="MonitoredUsersList">
                {
                    this.desplegateAllActivities().map((selectedKeyOfObject)=>{
                        return(
                            //Ésta es una de las filas completas que se muestra en la página de By_application
                            <tr key={selectedKeyOfObject}>
                            <td className="activityName">{ selectedKeyOfObject }</td>
                            <td className="userActivityPreviews">
                            <PreviewActivities index={selectedKeyOfObject}
                            >
                            </PreviewActivities>
                            </td>
                            </tr>
                        );
                    })
                }
                </tbody>
            </table>
            </div>
        );
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(By_application));