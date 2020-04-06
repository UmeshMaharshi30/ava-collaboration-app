import React from 'react';
import logo from './../../ava-logo.png';
import {Navbar, Nav} from 'react-bootstrap';

class AvaNavBar extends React.Component {

    render() {
        return (
            <Navbar expand="lg" bg="light" variant="light">
                <Navbar.Brand href="#home">
                <img src={logo} width="90" height="40" className="d-inline-block align-top" alt="Ava logo"/></Navbar.Brand>
            </Navbar>
        );
    }
}

export default AvaNavBar;