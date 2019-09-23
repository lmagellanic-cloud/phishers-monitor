import React from 'react';
import './MonitoredUsersList.css';
import './By_all_models';
import { connect } from 'react-redux';
import { setOrderBy, BY_ALL_MODELS, BY_APLICATION } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";
import By_all_models from './By_all_models';

class MonitoredUsersList extends React.Component {
    renderByOrderInChoice(){
        switch(this.props.orderBy){
            case BY_ALL_MODELS:
                return(
                    <By_all_models>
                    </By_all_models>
                );
            case BY_APLICATION:
                return(<h1>En desarrollo</h1>);
            default:
                return(
                    <By_all_models>
                    </By_all_models>
                );
        }
    }

    render(){
        return(
            <div className="table-responsive">
                <div className="MonitoredUserList_tags">
                    <button type="button" className="btn btn-sm btn-outline-secondary" 
                        onClick={
                            () => { 
                                console.log("BY_ALL_MODELS");
                                this.props.dispatch(setOrderBy(BY_ALL_MODELS)); 
                            }
                        }
                    >Todos los modelos</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={
                            () => { 
                                console.log("BY_APLICATION");
                                this.props.dispatch(setOrderBy(BY_APLICATION)); 
                            }
                        }
                    >Por aplicación</button>
                </div>
                {this.renderByOrderInChoice()}
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
