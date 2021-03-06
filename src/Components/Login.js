import React, { Component } from "react";
import { Button, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import Axios from 'axios'
import "../Styles/Login.css";
import packageJson from '../../package.json'
import { GoogleLogin } from 'react-google-login';
import {API_ENDPOINT} from '../api-config.js'


//API Link
//https://plug-dj-clone-api.herokuapp.com

// const apiEndpoint = 'http://127.0.0.1:5000'
// const apiEndpoint = 'https://plug-dj-clone-api.herokuapp.com'
const apiEndpoint = API_ENDPOINT


export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      googleResponse: null
    };
  }

  

  validateForm() {
    return this.state.username.length > 0 && this.state.password.length > 0 && !this.props.disableLoginButton;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = event => {
    event.preventDefault();

    this.props.changeUsername(this.state.username)

    //call backend
    var data = {
        username: this.state.username,
        password: this.state.password
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/login'

    Axios.post(url, data)
      .then((response) => {
        // Login attempt was successful
        if(response.data === 'success'){
          this.props.changeLoggedIn(true)

          this.forceUpdate()
        }else if(response.data === 'fuck you'){
          alert('Stop trying to ruin my database you dingus')
        }else if(response.data === 'user already connected'){
          alert('This user is already connected you dingus')
        }else{
          alert('Your password was wrong you dingus')
        }
      })

  }

  responseGoogle = (response) => {
    console.log(response)
  }

  render() {
    return (
      
      

      <div>
        <div style={{'position':'fixed', 'left':'5px', 'top':'5px'}}>
          Backend Version: {this.props.backEndVersion}
        </div>
        <div style={{'position':'fixed', 'left':'5px', 'top':'25px'}}>
          Frontend Version: {packageJson.projectVersion}
        </div>


        {!this.props.disableLoginButton && 
          <div className="Login">
          <form onSubmit={this.handleSubmit}>
            <FormGroup controlId="username" bsSize="large">
              <ControlLabel>Username</ControlLabel>
              <FormControl
                autoFocus
                type="text"
                value={this.state.username}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup controlId="password" bsSize="large">
              <ControlLabel>Password</ControlLabel>
              <FormControl
                value={this.state.password}
                onChange={this.handleChange}
                type="password"
              />
            </FormGroup>
            <Button
              block
              bsSize="large"
              disabled={!this.validateForm()}
              type="submit">

              Login
            </Button>
          </form>
        </div>
        }


      {/* <GoogleLogin
        clientId="1037164592642-dlma0aers6dh2fdd1s602kq5qkmktltk.apps.googleusercontent.com"
        buttonText="Login"
        onSuccess={this.responseGoogle}
        onFailure={this.responseGoogle}
      /> */}

        {this.props.disableLoginButton &&
          <div style={{'margin': 'auto', 'width': '50%', 'border': '3px solid white', 'padding': '10px', 'marginTop':'20%', 'color':'white'}}>
            <h1>You do not have the latest version of the website, please hard refresh(ctrl + shift + R). If this does not work, close your browser and reopen.</h1>
          </div>
        }
        
      </div>
    );
  }
}