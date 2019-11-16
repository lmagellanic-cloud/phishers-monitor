import React from 'react';
import PreviewModels from './PreviewModels';
import './By_all_models.css';
import { connect } from 'react-redux';
import { withRouter } from "react-router-dom";

class By_all_models extends React.Component {

    render(){
        return(
            <div className="table-responsive">
            <table className="table table-sm">
                <thead>
                <tr>
                    <th className="text-center userNameTh">User</th>
                    <th className="text-center modelsTh">Models</th>
                </tr>
                </thead>
                <tbody className="MonitoredUsersList">
                {this.props.monitoredUsers.map((monitoredUser, index)=>{
                    
                    //Comienzo de cada fila de todos los modelos de cada usuario
                    return (
                        <PreviewModels key={index} index={index}
                        monitoredUser={monitoredUser}
                        >
                        </PreviewModels>
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