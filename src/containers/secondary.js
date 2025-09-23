import React, { useState, useEffect, useReducer } from 'react'
import {Row, Col, Button, Form, FormGroup, Input, Table, Alert, InputGroup, InputGroupAddon, InputGroupText  } from 'reactstrap'
import { containers } from '../config/db'
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
    switch(action.type){
        case 'ADD':
        return {
            ...state,
            resultsList: action.results.concat(state.resultsList)
        }
        case  'LOCAL':
        return{
            ...state,
            resultsList: action.results
        }
        default: 
        return state
    }
}

function Secondary(){
    const [data, dispatch] = useReducer(dataReducer, initialState)
    const [barcode, setBarcode] = useState('')
    const [processingAlert, setProcessingAlert] = useState(false)
    const [processingSuccess, setProcessingSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [processingFailure, setProcessingFailure] = useState(false)
    const [failureMessage, setFailureMessage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const getLocalItems = async () => {
            const local = await handleLocalStorage('secondary') || []
            dispatch({ type: 'LOCAL', results: local})
        }
        getLocalItems()
    },[])

    useEffect(() => {
        if(data && data.resultsList && data.resultsList.length > 0){
            localforage.setItem('secondary', data.resultsList)
        }
    },[data])

    useEffect(() => {
        setTimeout(()=>{
            if(barcode && barcode !== '' && barcode.length === 15 ){
                setLoading(true)
                setTimeout(()=>{
                    handleSubmit()
                }, 1000)
            }
        }, 1000)
    },[barcode])

    const setBarcodeInput = e => {
        e.preventDefault()
        setBarcode(e.target.value.replace(/\D/g,''))
    }

    const [playSuccess] = useSound(SuccessSound)
    const [playError] = useSound(ErrorSound)    

    const update = async () => {
            const updateValue = {
                'container_barcode' : barcode
            }
            const updateBarcode = await containers(updateValue, 'container-check-in')
            if(updateBarcode && updateBarcode.code === 201){
                setBarcode('')
                success('Container successfully updated')
                dispatch({ type: 'ADD', results: [updateBarcode.results]})
            } else {
                failure('There was a problem updating this container')
            } 
    }

    const handleLocalStorage = async (key) => {
        const results = await localforage.getItem(key)
        return results
    }
    
    const handleEnter = (event) => {
        if (event.keyCode === 13) {
          const form = event.target.form;
          const index = Array.prototype.indexOf.call(form, event.target);
          form.elements[index + 1].focus();
          event.preventDefault();
        }
    }   

    const success = message => {
        setLoading(false)
        playSuccess()
        toast.success(message, {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
        });
    }
    
    const failure = message => {
        playError()
        setLoading(false)
        toast.error(message, {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
        });
    }

    const handleSubmit = async () => {
        setLoading(true)
        if(barcode.length === 15 && barcode.startsWith('310')){
            const verifyBarcode = await containers('', 'get-containers', {"container_barcode" : barcode})
            if(verifyBarcode && verifyBarcode.code === 201){
                if(verifyBarcode && verifyBarcode.results && verifyBarcode.results.check_in === null){
                    if(verifyBarcode && verifyBarcode.results && verifyBarcode.results.location_needed === 1){
                        if(window.confirm('Are you sure you want to check this container in without a location?')) {
                            update()
                        } else {
                            setLoading(false)
                        }
                    } else {
                        update()
                    }
                } else {
                    if(window.confirm(`This item has already been checked in. Do you want to check it in again?`)){
                        update()
                    } else {
                        setLoading(false)
                        setBarcode('')
                    }
                }        
            } else {
                failure("Could not find container record. Rescan")
            }    
        } else {
            failure('Barcode must be 15 characters long and begin with 310')
        }   
    }
    

    return(
        <div className="container-fluid" style={{marginTop: "30px"}}>
        <ToastContainer />
            <Row>  
                <Col xs="4">
                    <div className="menu sticky-top p-3 bg-light">
                    <h1 className="display-4">Check In Without Location</h1>
                    <Form>
                    <InputGroup>
                                <Input 
                                    type="text" 
                                    autoFocus={true}
                                    value={barcode} 
                                    placeholder="Enter barcode..." 
                                    bsSize="lg" 
                                    onChange={e => setBarcodeInput(e)}
                                    onKeyDown={handleEnter}
                                />
                        {loading ?        
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
                        {/* <br /> */}
                        {/* <Button color="primary" onClick={e => handleSubmit(e)}>Submit</Button> */}

                        {/* <div style={{height: "80px"}}>
                        <FormGroup>
                            <Alert style={{display: 'none'}}></Alert>
                            {processingAlert ?
                                <Alert color="warning">Sending data to the server...</Alert>
                            : ''}
                             {processingSuccess ?
                                <Alert color="success">{successMessage}</Alert>
                            : ''}
                            {processingFailure ?
                                <Alert color="danger">{failureMessage}</Alert>
                            : ''}
                        </FormGroup>    
                        </div>    */}
                    </Form>  
                    </div>
                </Col>
                <Col xs="8">
                <div className="menu sticky-top p-3 bg-light">
                <h1 className="display-4">Check in results </h1>
                {data && data.resultsList && data.resultsList.length > 0 ?
                    <Table>
                        <thead>
                            <tr>
                                <th>Container Barcode</th>
                                <th>Container Box</th>
                                <th>Location barcode </th>
                                <th>Shelf Location</th>
                                <th>Checked Out</th>
                                <th>Checked In</th>
                            </tr>
                        </thead>
                        <tbody>
                        {Object.keys(data.resultsList).map((items,idx) =>
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

export default Secondary