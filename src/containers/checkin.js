import React, { useState, useEffect, Fragment, useReducer, useRef } from 'react'
import {Row, Col, Button, Form, FormGroup, Label, Input, FormText, Table, Alert, InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap'
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
  const [location, setLocation] = useState('')
  const [show, setShow] = useState(false)
  const [data, dispatch] = useReducer(dataReducer, initialState)
  const [barcode, setBarcode] = useState('')
  const [verifiedBarcode, setVerifiedBarcode] = useState('')
  const [processingAlert, setProcessingAlert] = useState(false)
  const [processingSuccess, setProcessingSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [processingFailure, setProcessingFailure] = useState(false)
  const [failureMessage, setFailureMessage] = useState('')
  const todayDate = new Date().toISOString().slice(0, 10);
  const [verified, setVerified] = useState(false)
  const [verifiedLocation, setVerifiedLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const inputEl = useRef(null);

  useEffect(() => {
    setTimeout(()=>{
      if (location && location !== '' && location.length === 15) {
        setTimeout(()=>{
          verifyLocation()
        }, 1000)
      }
    }, 1000)
  }, [location])


  useEffect(() => {
    const getLocalItems = async () => {
      const local = await handleLocalStorage('checkin') || []
      dispatch({ type: 'LOCAL', results: local})
    }
    getLocalItems()
  }, [])

  useEffect(() => {
    if(data && data.resultsList && data.resultsList.length > 0){
      localforage.setItem('checkin', data.resultsList)
    }
  }, [data])

  useEffect(() => {
    setTimeout(() => {
      if (barcode && barcode !== '' && barcode.length === 15 && location && location !== '') {
        setLoading(true)
        setTimeout(()=>{
          update()
        }, 1000)
      }
    }, 1000)
  }, [barcode, location]
  )

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
    //Verify barcode is correct length
    if (barcode.length === 15 && barcode.startsWith('310')) {
      const updateValue = {
        'container_barcode': barcode,
        'location_barcode': location
      };
      // Send Data to server
      const verifyBarcode = await containers('', 'get-containers', {"container_barcode" : barcode})
      // If server verifies that barcode exists then run through validations
      if (verifyBarcode && verifyBarcode.code === 201) {
        // Verify container has been checked out
        const verifyCheckedOut = containerCheckOutValidation(verifyBarcode, updateValue, barcode)
        if (verifyCheckedOut === true) {
          containerCheckOutValidationUpdate(verifyBarcode, updateValue, barcode)
        }
      } else {
        setLoading(false);
        failure("Could not find container record. Rescan");
      }
    } else {
      setLoading(false);
      failure('Barcode must be 15 characters long and begin with 310');
    }
  }

  //Verify that this container has been checked out. If not, send it through manual validation
  const containerCheckOutValidation = (verifyBarcode, updateValue, barcode) => {
    if (verifyBarcode && verifyBarcode.results && verifyBarcode.results.check_out !== null) {
      return true;
    } else {
      manualAlertCheckIn(verifyBarcode, updateValue, barcode);
    }
  }

  const containerCheckOutValidationUpdate = (verifyBarcode, updateValue, barcode) => {
    if (verifyBarcode && verifyBarcode.results && verifyBarcode.results.check_in === null) {
      updateBarcode(updateValue);
    } else {
      if (window.confirm(`This item has already been checked in. Do you want to check it in again?`)) {
        updateBarcode(updateValue);
      } else {
        setLoading(false);
        setBarcode('');
      }
    }
  }

  const manualAlertCheckIn = (verifyBarcode, updateValue, barcode) => {
    if (window.confirm('Are you sure you want to check this container? It has not been checked out yet.')) {
        const verifyBarcodes = window.prompt("Verify Barcode");
        if (verifyBarcodes === barcode) {
          containerCheckOutValidationUpdate(verifyBarcode, updateValue, barcode);
        } else {
          failure(`The barcode you entered ${verifyBarcodes} does not match ${barcode}`)
          setBarcode('');
          setLoading(false);
        }
    } else {
      setBarcode('');
      setLoading(false);
    }
  }

  const updateBarcode = async (updateValue) => {
    const updateBarcode = await containers(updateValue, 'container-check-in')
    if (updateBarcode && updateBarcode.code === 201) {
      setBarcode('');
      success('Container successfully updated');
      dispatch({ type: 'ADD', results: [updateBarcode.results]});
    } else {
      failure('There was a problem updating this container');
    }
  }


  const handleLocalStorage = async (key) => {
    const results = await localforage.getItem(key);
    return results;
  }

  const handleEnter = (event) => {
    if (event.keyCode === 13) {
      const form = event.target.form;
      const index = Array.prototype.indexOf.call(form, event.target);
      event.preventDefault();
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

  const reset = e => {
    e.preventDefault();
    setBarcode('');
    setLocation('');
    setVerifiedLocation('');
    setVerified(false);
    setTimeout(()=>{
      inputEl.current.focus()
    }, 2000);
  }

  return(
    <div className="container-fluid" style={{marginTop: "30px"}}>
      <ToastContainer />
      <Row>
        <Col xs="4">
          <div className="menu sticky-top p-3 bg-light">
            <h1 className="display-4">Check in with location</h1>

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
                    placeholder="Location barcode"
                    bsSize="lg"
                    type="text"
                    onChange={e => setLocationInput(e)}
                    onKeyDown={handleEnter}
                  />
                </FormGroup>
              }
              { verified ?
                <InputGroup>
                  <Input
                    type="text"
                    autoFocus={true}
                    value={barcode}
                    placeholder="Container barcodes"
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
              : '' }
            </Form>
            <Button color="primary" onClick={e => reset(e)}>Next Location</Button>
          </div>
        </Col>
        <Col xs="8">
          <div className="menu sticky-top p-3 bg-light">
          <h1 className="display-4">Check in results </h1>
            { data && data.resultsList && data.resultsList.length > 0 ?
              <Table>
                <thead>
                  <tr>
                    <th>Container barcode</th>
                    <th>Container</th>
                    <th>Location barcode </th>
                    <th>Shelf location</th>
                    <th>Last checked out</th>
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
                      <td>{data.resultsList[items].check_out}</td>
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
