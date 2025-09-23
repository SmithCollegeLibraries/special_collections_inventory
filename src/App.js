import React from 'react'
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

//Import components
import Header from './components/header'

//Import containers
import CheckIn from './containers/checkin'
import CheckOut from './containers/checkout'
import Secondary from './containers/secondary'

function App() {
  
  return (
      <div>
        <Router basename="/special_collections_inventory/app">
          <Header />
          <div className="container-fluid">
              <Switch>
                  <Route path="/checkout">
                      <CheckOut />
                  </Route>    
                  <Route path="/primarycheckin">
                      <CheckIn />
                  </Route>
                  <Route path="/secondarycheckin">
                      <Secondary/>
                  </Route>
                  <Route exact path="/">
                      <CheckOut />
                  </Route>
                  <Route path="*">
                    <CheckOut />
                  </Route>
              </Switch>  
          </div>
        </Router>
      </div>  
  );
}

export default App;
