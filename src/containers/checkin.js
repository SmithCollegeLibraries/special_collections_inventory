import React, { useState, useEffect, useReducer, useRef } from 'react'
import {Row, Col, Button, Form, FormGroup, Input, Table, Alert, InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap'
import { containers, locations } from '../config/db'
import localforage from 'localforage'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loading-icons'
import useSound from 'use-sound';

import SuccessSound from '../sounds/success.mp3'
import ErrorSound from '../sounds/error.mp3'

const initialState = {
    resultsList: [],
}


const dataReducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        resultsList: action.results.concat(state.resultsList)
      }
    case  'LOCAL':
      return {
        ...state,
        resultsList: action.results
      }
  }
}

function CheckIn() {
  const [location, setLocation] = useState('');
  const [data, dispatch] = useReducer(dataReducer, initialState);
  const [barcode, setBarcode] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedLocation, setVerifiedLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const inputEl = useRef(null);

  useEffect(() => {
    let timer1, timer2;
    timer1 = setTimeout(() => {
      if (location && location !== '' && location.length === 15) {
        timer2 = setTimeout(() => {
          verifyLocation();
        }, 200);
      }
    }, 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location]);

  useEffect(() => {
    if (verified) {
      // Focus the container input (no JSX changes required)
      const containerInput = document.querySelector('input[placeholder="Container"]');
      if (containerInput && typeof containerInput.focus === 'function') {
        containerInput.focus();
      }
    }
  }, [verified]);


  useEffect(() => {
    const getLocalItems = async () => {
      const local = await handleLocalStorage('checkin') || [];
      dispatch({ type: 'LOCAL', results: local});
    }
    getLocalItems();
  }, []);

  useEffect(() => {
    if (data && data.resultsList && data.resultsList.length > 0) {
      localforage.setItem('checkin', data.resultsList);
    }
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    if (barcode && barcode !== '' && barcode.length === 15 && location && location !== '') {
      setLoading(true);
      (async () => {
        try {
          await update();
        } finally {
          if (cancelled) return;
          setLoading(false);
          setBarcode('');
        }
      })();
    }
    return () => { cancelled = true; };
  }, [barcode, location]);

  const [playSuccess] = useSound(SuccessSound);
  const [playError] = useSound(ErrorSound);

  const verifyLocation = async () => {
    console.log(location);
    const verify = await locations('', 'verify-location', {location_barcode: location});
    if (verify && verify.code === 201) {
      setVerified(true);
      setVerifiedLocation(verify.results.shelf_location);
      success(`${location} ${verify.results.shelf_location} successfully matched.`);
    } else {
      failure('Could not verify location. Rescan.');
    }
  }

  const setLocationInput = e => {
    e.preventDefault();
    setLocation(e.target.value.replace(/\D/g,''));
  }

  const setBarcodeInput = e => {
    e.preventDefault();
    setBarcode(e.target.value.replace(/\D/g,''));
  }


  const update = async () => {
    // Verify barcode is correct length
    if (barcode.length === 15 && barcode.startsWith('310')) {
      const updateValue = {
        'container_barcode': barcode,
        'location_barcode': location
      };
      // Send data to server
      const verifyBarcode = await containers('', 'get-containers', {"container_barcode" : barcode})
      // If server verifies that barcode exists then run through validations
      if (verifyBarcode && verifyBarcode.code === 201) {
        updateBarcode(updateValue);
      } else {
        setLoading(false);
        failure("Could not find container record. Rescan");
      }
    } else {
      setLoading(false);
      failure('Barcode must be 15 characters long and begin with 310');
    }
  }

  // const containerCheckOutValidationUpdate = (verifyBarcode, updateValue, barcode) => {
  //   if (verifyBarcode && verifyBarcode.results && verifyBarcode.results.check_in === null) {
  //     updateBarcode(updateValue);
  //   } else {
  //     if (window.confirm(`This item has already been checked in. Do you want to check it in again?`)) {
  //       updateBarcode(updateValue);
  //     } else {
  //       setLoading(false);
  //       setBarcode('');
  //     }
  //   }
  // }

  const updateBarcode = async (updateValue) => {
    const updateBarcode = await containers(updateValue, 'container-check-in')
    if (updateBarcode && (updateBarcode.code === 201)) {
      setBarcode('');
      success('Container successfully updated');
      dispatch({ type: 'ADD', results: [updateBarcode.results]});
    } else {
      failure('There was a problem updating this container.');
    }
  }

  const handleLocalStorage = async (key) => {
    const results = await localforage.getItem(key);
    return results;
  }

  const handleEnter = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.preventDefault();
      const value = (event.target.value || '');
      if (!(value.length === 15 && value.startsWith('310'))) {
        failure('Barcode must be 15 characters long and begin with 310.');
      }
    }
  }

  const success = message => {
    playSuccess();
    toast.success(message, {
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
    });
  }

  const failure = message => {
    playError();
    toast.error(message, {
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
    });
  }

  const handleResetLocation = (e) => {
    e.preventDefault();
    setLocation('');
    setVerified(false);
    setVerifiedLocation('');
    // Focus the location input
    if (inputEl && inputEl.current && typeof inputEl.current.focus === 'function') {
      inputEl.current.focus();
    } else {
      const loc = document.querySelector('input[placeholder="Location"]');
      if (loc && typeof loc.focus === 'function') loc.focus();
    }
  };

  return(
    <div className="container-fluid" style={{marginTop: "30px"}}>
      <ToastContainer />
      <Row>
        <Col xs="4">
          <div className="menu sticky-top p-3 bg-light">
            <h1 className="display-4" style={{fontSize: "32px"}}>Check in</h1>

            <Form>
              { verified && verifiedLocation.length !== '' ?
                <Alert color="primary">
                  <h5 className="alert-heading"><strong>{verifiedLocation}</strong></h5>
                </Alert>
                :
                <FormGroup>
                  <Input
                    autoFocus={true}
                    innerRef={inputEl}
                    value={location}
                    placeholder="Location"
                    bsSize="lg"
                    type="text"
                    onChange={e => setLocationInput(e)}
                    onKeyDown={handleEnter}
                  />
                </FormGroup>
              }
              <InputGroup>
                <Input
                  type="text"
                  value={barcode}
                  placeholder="Container"
                  bsSize="lg"
                  onChange={e => setBarcodeInput(e)}
                  onKeyDown={handleEnter}
                />
              { loading ?
                <InputGroupAddon addonType="append">
                  <InputGroupText>
                    <Oval
                      stroke="#000"
                      style={{height: "2em"}}
                    />
                  </InputGroupText>
                </InputGroupAddon>
              : ''}
              </InputGroup>
              <Button color="warning" className="mt-3" onClick={handleResetLocation}>Reset location</Button>
            </Form>
          </div>
        </Col>
        <Col xs="8">
          <div className="menu sticky-top p-3 bg-light">
          <h1 className="display-4" style={{fontSize:"32px"}}>Check in results </h1>
            { data && data.resultsList && data.resultsList.length > 0 ?
              <Table>
                <thead>
                  <tr>
                    <th>Container barcode</th>
                    <th>Container description</th>
                    <th>Location barcode </th>
                    <th>Location description</th>
                    {/* <th>Last checked out</th> */}
                    <th>Last checked in</th>
                  </tr>
                </thead>
                <tbody>
                  { Object.keys(data.resultsList).map((items,idx) =>
                    <tr key={idx}>
                      <td>{data.resultsList[items].container_barcode}</td>
                      <td>{data.resultsList[items].container_box}</td>

                      <td>{data.resultsList[items].location_barcode}</td>
                      <td>{data.resultsList[items].shelf_location}</td>
                      {/* <td>{data.resultsList[items].check_out}</td> */}
                      <td>{data.resultsList[items].check_in}</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            : ''}
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default CheckIn;
