import React, { Component }from 'react';
import './App.css';
import Home from './Home';
import User from './User';
import NavigationBar from './NavigationBar';
import SideBar from './SideBar';
import { connect } from 'react-redux';
import { getMonitoredUsers, getMonitoredUserData } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";

const urlMonitoredUsersNames = "http://localhost:5000/monitoredUsers"
const urlUserData = "http://localhost:5000/monitoredUser/";

class App extends Component {
  componentDidMount(){
    //console.log("componentDidMount de App.js invocado");
    fetch(urlMonitoredUsersNames).then((response) => {return response.json()})
      .then( (data) => {
        //console.log("data de fetch es: ", data);
        data = data["allMonitoredUser"];
        var i = 0;
        var temp = data;
        for (i = 0; i < data.length; i++){
          //console.log(data[i][0]);
          temp[i] = data[i][0];
        }
        data = temp;
        this.props.dispatch(getMonitoredUsers(data));
      });

      var urlTemp = urlUserData + "user_0";
      if(this.props.simulation){
        urlTemp = urlTemp + "?simulation=1";
      }
      fetch(urlTemp).then((response) => {return response.json()})
          .then( (data) => {
            //console.log("dataJSON de App.js es: ", data);
            this.props.dispatch(getMonitoredUserData(data));
            /* for (var key in data.monitoredJSON) {
              console.log(key);
            } */
          });
  }

  render(){
    return(
      <Router>
        <div>
          <NavigationBar />
          <div className="container-fluid">
              <div className="row">
                <SideBar />
                <Route path="/" exact component={ 
                    () => <Home monitoredUsers = { this.props.monitoredUsers }/> 
                  } 
                />
                <Route path="/monitoredUser/:id" component={ 
                    (props) => <User userName= { props.match.params.id }/> 
                  }
                />
              </div>
          </div>
        </div>
      </Router>
    );
  }
}

function mapStateToProps(state){
  return{
    ...state
  };
}

export default connect(mapStateToProps)(App);