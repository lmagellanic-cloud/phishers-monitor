import React from 'react';
import './MonitoredUsersList.css';
import './By_all_models';
import ByApplication from './By_application';
import { connect } from 'react-redux';
import { setOrderBy, BY_ALL_MODELS, BY_APPLICATION } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";
import ByAllModels from './By_all_models';

class MonitoredUsersList extends React.Component {
    renderByOrderInChoice(){
        switch(this.props.orderBy){
            case BY_ALL_MODELS:
                return(
                    <ByAllModels>
                    </ByAllModels>
                );
            case BY_APPLICATION:
                return(
                    <ByApplication>
                    </ByApplication>
                );
            default:
                return(
                    <ByAllModels>
                    </ByAllModels>
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
                                this.props.dispatch(setOrderBy(BY_ALL_MODELS)); 
                            }
                        }
                    >All models</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={
                            () => { 
                                this.props.dispatch(setOrderBy(BY_APPLICATION)); 
                            }
                        }
                    >Grouped by services</button>
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
