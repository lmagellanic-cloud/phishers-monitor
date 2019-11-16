import React from 'react';
import './NavigationBar.css';
import User from "./User";
import { connect } from 'react-redux';
import { onChangeSearch, requestNewData, changeAlarmTreshold } from './redux/actions';
import { BrowserRouter as Router, Route, Link} from "react-router-dom";
import { withRouter } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const urlUserData = "http://localhost:3000/monitoredUser/";
const urlAlarm = "http://localhost:5000/getAlarms";
const urlHome = "localhost:3000/";

class NavigationBar extends React.Component{
    constructor(props) {
        super(props);
        this.canvasArcRef = React.createRef();
    }

    componentDidMount(){
        this.drawCanvasArc(0);
        var milisegundos = 60;
        var tasaRefresco = 100;
        this.loopToRefreshArc(milisegundos, tasaRefresco, 0);
    }

    /**
     * 
     * @param {int} segundos El tiempo en segundos para que dé una vuelta al temporizador circular (periodo)
     * @param {int} tasaRefresco El tiempo en milisegundos que se desea que se muestree el cambio del temporizador circular (frames/segundo)
     * @param {int} endAngle Variable temporal necesaria para ser llamada recursivamente, por defecto, a 0
     */
    loopToRefreshArc(segundos, tasaRefresco, endAngle){
        setTimeout(() => {
            if(endAngle >= 2*Math.PI){
                endAngle = 0.01;
                //console.log("SOLICITUD REALIZADA");
                this.props.dispatch(requestNewData(true));
                if(this.props.alarmTreshold !== ""){
                    this.getAlarms_GET_HTTP()
                }
            }else{
                endAngle = endAngle + (2*Math.PI/segundos)/(1000/tasaRefresco);
            }
            this.drawCanvasArc(endAngle);
            this.loopToRefreshArc(segundos, tasaRefresco, endAngle);
        }, tasaRefresco);
    }

    drawCanvasArc(endAngle){
        //console.log("drawCanvasArc llamado y su endAngle es ", endAngle);
        var context = this.canvasArcRef.current.getContext("2d");
        context.clearRect(0, 0, this.canvasArcRef.current.width, this.canvasArcRef.current.height);

        var x = this.canvasArcRef.current.width/2;
        var y = this.canvasArcRef.current.height/2;
        var radius = Math.min(x, y);
        var counterClock = true;

        context.beginPath();
        context.arc(x, y, radius, 0, endAngle, counterClock);
        //Línea desde el punto de fin de arco hasta el centro
        context.lineTo(x, y);
        //Línea desde el centro hasta el inicio de arco
        context.lineTo(x + radius, y);
        //Rellenar porción de círculo
        var r = 255;
        var g = 0;
        var b = 0;
        var a = 255;
        var temp = 255*endAngle/(2*Math.PI);//x va de 0 a 1, debe ser de 0 a 2pi
        r = (temp);
        g = (255 - temp);
        context.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
        context.fill();
    }

    getAlarms_GET_HTTP(){
        var urlTemp = urlAlarm + "?treshold_percentage=" + this.props.alarmTreshold;
            //console.log("La ruta a refrescar en User es: ", urlTemp);
            fetch(urlTemp).then((response) => {return response.json()})
                .then( (data) => {
                var datosJSONAlarm = data["alarms"];
                /*
                console.log("datosJSONAlarm es ", datosJSONAlarm);
                console.log("datosJSONAlarm['no_alarm] es", datosJSONAlarm["no_alarm"]);
                */
                if(datosJSONAlarm["no_alarm"] === undefined){
                    Object.keys(datosJSONAlarm).forEach((userKey) =>{
                        Object.keys(datosJSONAlarm[userKey]).forEach((compareKey) =>{
                            var activityKey = compareKey.replace("compare", "activity");
                            var message = userKey + " " + activityKey +" : " + datosJSONAlarm[userKey][compareKey];
                            toast(message, {
                                position: toast.POSITION.TOP_CENTER,
                            });
                        });
                    });
                }
            });
    }

    render(){
        return[
            <nav key={1} className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                <canvas key={2} className="canvasArc" ref={this.canvasArcRef}></canvas>
                <Link key={3} to="/" className="companyName">Home</Link>
                <input key="searchBar" className="form-control form-control-dark w-100 searchBar" type="text" 
                    placeholder="Search user" aria-label="Search" 
                    value={this.props.search}
                    onChange={(e)=>{
                            this.props.dispatch(onChangeSearch(e.target.value));
                        }
                    }
                />
                <input type="number" className="form-control form-control-dark treshold" 
                    placeholder="Alarm treshold %" aria-label="Alarm treshold"  min="1" max="100"
                    value={this.props.alarmTreshold}
                    onChange={(e)=>{
                        this.props.dispatch(changeAlarmTreshold(e.target.value));
                        }
                    }
                />
                <ToastContainer autoClose={false} />
            </nav>
        ];
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default withRouter(connect(mapStateToProps)(NavigationBar));