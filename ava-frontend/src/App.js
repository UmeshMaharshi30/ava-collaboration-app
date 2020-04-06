import React from 'react';
import AvaNavBar from './components/navbar/navbar';
import { Route, BrowserRouter as Router, Redirect } from 'react-router-dom';
import './App.css';
import Collaborations from './components/collaborations/collaborations';
import Collaboration from './components/collaborations/collaboration';

function App() {
  return (
    <div className="container-fluid p-0">
      <AvaNavBar></AvaNavBar>
      <Router>
        <div className="col-10 mx-auto mt-2">
          <Route exact path="/"> <Redirect to="/collaborations" /> </Route>
          <Route exact  path="/collaborations" component={Collaborations} />
          <Route path="/collaborations/:id" component={Collaboration} />
        </div>
      </Router>
    </div>
  );
}

export default App;
