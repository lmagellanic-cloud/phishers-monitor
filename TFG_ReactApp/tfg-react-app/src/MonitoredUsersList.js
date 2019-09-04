import React from 'react';
import './MonitoredUsersList.css';
import { connect } from 'react-redux';
import { getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";

class MonitoredUsersList extends React.Component {
    render(){
        return(
            <div className="table-responsive">
                <table className="table table-sm">
                    <thead>
                    <tr>
                        <th className="text-center">#</th>
                        <th className="text-center">Nombre</th>
                    </tr>
                    </thead>
                    <tbody className="MonitoredUsersList">
                        {this.props.monitoredUsers.map((monitoredUser, index)=>{
                            return (
                                <tr key={index}>
                                    <td className="indexTd">{ index }</td>
                                    <td className="userNameTd">
                                        {
                                            /*
                                            <a key={index} href= {urlSite + monitoredUser}> 
                                            {monitoredUser}
                                            </a> 
                                            */
                                            /* 
                                           <Link key={index} to= {"/monitoredUser/" + monitoredUser}> 
                                           {monitoredUser}
                                           </Link> 
                                            */
                                            
                                            <button key={index} className="monitoredUserListItem" onClick= {
                                                    () => {
                                                        var urlTemp = urlUserData + monitoredUser;
                                                        if(this.props.simulation){
                                                            urlTemp = urlTemp + "?simulation=1";
                                                        }
                                                        fetch(urlTemp).then((response) => {return response.json()})
                                                            .then( (data) => {
                                                            //console.log("dataJSON de button en MonitoredUsersList es: ", data);
                                                            this.props.dispatch(getMonitoredUserData(data));
                                                            //window.location.replace(urlSite + monitoredUser);
                                                            this.props.history.push("/monitoredUser/" + monitoredUser);
                                                        });
                                                    }
                                                }
                                            >
                                                {monitoredUser}
                                            </button>
                                            
                                        }
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

export default withRouter(connect(mapStateToProps)(MonitoredUsersList));
