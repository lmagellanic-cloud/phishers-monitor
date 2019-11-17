import React from 'react';
import './User.css';
import UserMonitor from './UserMonitor';
import { connect } from 'react-redux';
import { getMonitoredUserData, changeSensitivity, requestNewData } from './redux/actions';
import { withRouter } from "react-router-dom";

const urlUserData = "http://localhost:5000/monitoredUser/";

class User extends React.Component {
    constructor(props) {
        super(props);
        this.sliderSensibilidad = React.createRef();
        this.refreshButton = React.createRef();
    }

    componentDidMount(){
        this.sliderSensibilidad.current.value = this.props.sensitivity
        
    }

    realizarPeticionGET(){
        console.log("datosJSON Input: ", this.props.monitoredUserData);
        var urlTemp = urlUserData + this.props.userName;
        if(this.props.simulation){
            urlTemp = urlTemp + "?simulate=1"
        }
        console.log("La ruta a refrescar en User es: ", urlTemp);
        fetch(urlTemp).then((response) => {return response.json()})
            .then( (data) => {
            //console.log("dataJSON de button en MonitoredUsersList es: ", data);
            this.props.dispatch(getMonitoredUserData(data));
            this.props.history.push("/monitoredUser/" + this.props.userName);
            console.log("datosJSON Output: ", data);
        });
    }

    generateTableRow(){
        var arrayModelKeys = [];
        var arrayActivityKeys = [];
        var arrayCompareKeys = [];

        if(this.props.requestNewData){
            this.realizarPeticionGET();
            this.props.dispatch(requestNewData(false));
        }

        if(this.props.monitoredUserData["monitoredUser"] === this.props.userName){
            var compare = this.props.monitoredUserData["compare"];
            var monitoredJSON = this.props.monitoredUserData["monitoredJSON"];
        }else{
            this.realizarPeticionGET()
        }

        if ((compare !== undefined) && (monitoredJSON !== undefined)){
            Object.keys(compare).forEach((compareKey) =>{
                //Pone todos los 'compares' del JSON en la variable local arrayCompareKeys
                arrayCompareKeys.push(compareKey);
            });
            Object.keys(monitoredJSON).forEach((monitoredJSONKey)=>{
                if(monitoredJSONKey.includes("modelUserData_")){
                    //Pone todos los 'modelUserData' del JSON en la variable local arrayModelKeys
                    arrayModelKeys.push(monitoredJSONKey);
                }
                if(monitoredJSONKey.includes("activityUserData_")){
                    //Pone todos los 'activityUserData' del JSON en la variable local arrayActivityKeys
                    arrayActivityKeys.push(monitoredJSONKey);
                }
            });
        }
        
        return(
            <tbody>
                { arrayModelKeys.map((key_3, index) => {
                    var row_i = key_3.slice(-1);
                    return(
                        <tr key={row_i}>
                            <td className="indexTd">
                                {row_i}
                            </td>
                            <td className="modelTd">
                                <UserMonitor doSensitivity={false} 
                                    tipoCanvas={"modelTd"} 
                                    index={ index } 
                                    widthCSS = { 85 }
                                    heightCSS = { 85 }
                                    data={ monitoredJSON["modelUserData_" + row_i] } 
                                >
                                </UserMonitor>
                            </td>
                            <td className="activityTd">
                                <UserMonitor doSensitivity={false} 
                                    tipoCanvas={"activityTd"} 
                                    index={ index } 
                                    widthCSS = { 85 }
                                    heightCSS = { 85 }
                                    data={ monitoredJSON["activityUserData_" + row_i] } 
                                >
                                </UserMonitor>
                            </td>
                            <td className="compareTd">
                                <UserMonitor doSensitivity={true} 
                                    tipoCanvas={"compareTd"} 
                                    index={ index } 
                                    widthCSS = { 85 }
                                    heightCSS = { 85 }
                                    data={ compare["compare_" + row_i] } 
                                >
                                </UserMonitor>
                            </td>
                        </tr>
                    );
                })
                }
            </tbody>
        );
    }

    addRefreshButton(){
        return(<button ref={this.refreshButton} className="btn btn-sm btn-outline-secondary refreshButton" onClick= {
            () => {
                this.realizarPeticionGET();
            }
        }>Refresh</button>)
    }

    render(){
        return(
            <main id="monitoredUserScreen" role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">{ this.props.userName }</h1>
                    <div className="btn-toolbar mb-2 mb-md-0">
                        
                    </div>
                </div>
                <div className="w-100 slidecontainer">
                    <input type="range" min="0" max="5" defaultValue= {0} step="1"
                        className="slider" ref={ this.sliderSensibilidad }
                        onChange = {(e) => {
                                //console.log("Sensibilidad en User: ", this.sliderSensibilidad.current.value);
                                this.props.dispatch(changeSensitivity(parseInt(e.target.value)));
                            }
                        }
                    ></input>
                </div>
                <div className="table-responsive">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th className="text-center indexTh">#</th>
                                <th className="text-center modelTh">Model</th>
                                <th className="text-center activityTh">Actual activity</th>
                                <th className="text-center compareTh">Diference</th>
                            </tr>
                        </thead>
                        { this.generateTableRow() }
                    </table>
                </div>
                { this.addRefreshButton() }
            </main>
        )
    }
}


function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(User));
