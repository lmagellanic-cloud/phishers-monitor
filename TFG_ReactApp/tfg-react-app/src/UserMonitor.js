import React from 'react';
import { connect } from 'react-redux';

class UserMonitor extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
    }

    componentDidMount(){
        //console.log("this.props.sensitivity en UserMonitor es: ", this.props.sensitivity);
        var data = this.props.data;
        var doSensitivity = this.props.doSensitivity;
        var canvas = this.canvasRef.current;
        var canvasContext = canvas.getContext("2d");
        var r = 255;
        var g = 0;
        var b = 0;
        var a = 255;
        for(var i=0; i<data.length; i++){
            for(var j=0; j<data[i].length; j++){
                var temp = data[j][i]; 
                // 0 => 0%, 255 => 100%
                temp = this.getSplineValue(temp);
                r = (temp);
                g = (255 - temp);
                canvasContext.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
                canvasContext.fillRect( i, j, 1, 1 );   //Set pixel in (i, j)
            }
        }
    }

    getSplineValue(x){
        //console.log("this.props.sensitivity en getSplineValue es: ", this.props.sensitivity);
        var A = 255;
        var sensitivityTemp = 0;
        if(this.props.doSensitivity){
            sensitivityTemp = this.props.sensitivity;
        }else{
            sensitivityTemp = 0;
        }
        switch(sensitivityTemp){
            case 0:{ 
                return A*x;
            }
            case 1:{
                return A*Math.pow(x, 1/2);
            }
            case 2:{
                return A*Math.pow(x, 1/3);
            }
            case 3:{
                return A*Math.pow(x, 1/4);
            }
            case 4:{
                return A*Math.pow(x, 1/5);
            }
            case 5:{
                return A*Math.pow(x, 1/6);
            }
            default:{
                A = 1;
                return A*(x);
            }
        }
    }

    render(){
        var widthCSS = this.props.widthCSS;
        var heightCSS = this.props.heightCSS;
        widthCSS = widthCSS.toString() + "%";
        heightCSS = heightCSS.toString() + "%";

        return(
            <canvas key={this.index}
                style = {{"width" : widthCSS, "height:" : heightCSS }}
                ref={this.canvasRef}
                width={this.props.data.length}
                height={this.props.data.length}
            ></canvas>
        );
    }
}

function mapStateToProps(state){
    return{
      ...state
    };
}

export default connect(mapStateToProps)(UserMonitor);
