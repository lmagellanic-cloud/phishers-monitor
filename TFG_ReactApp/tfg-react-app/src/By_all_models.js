import React from 'react';
import UserMonitor from './UserMonitor';
import PreviewModels from './PreviewModels';
import './By_all_models.css';
import { connect } from 'react-redux';
import { getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";

class By_all_models extends React.Component {

    render(){

        return(
            <div className="table-responsive">
            <table className="table table-sm">
                <thead>
                <tr>
                    <th className="text-center userNameTh">Usuario</th>
                    <th className="text-center modelsTh">Modelos</th>
                </tr>
                </thead>
                <tbody className="MonitoredUsersList">
                {this.props.monitoredUsers.map((monitoredUser, index)=>{
                    
                    //Comienzo de cada fila de todos los modelos de cada usuario
                    return (
                        <tr key={index}>
                        <td className="userName">{ monitoredUser }</td>
                        <td className="userModelPreviews">
                        <PreviewModels index={index}
                        monitoredUser={monitoredUser}
                        >
                        </PreviewModels>
                        </td>
                        </tr>
                    );
                })}
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

export default withRouter(connect(mapStateToProps)(By_all_models));