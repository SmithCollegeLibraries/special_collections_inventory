import React, { useState, useEffect, Fragment, useReducer } from 'react'
import {Row, Col, Button, Form, FormGroup, Label, Input, Table, Alert, InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap'
import { containers } from '../config/db'
import localforage from 'localforage'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loading-icons'
import useSound from 'use-sound';

import SuccessSound from '../sounds/success.mp3'
import ErrorSound from '../sounds/error.mp3'


const initialResultsState = {
    data: []
}

const resultsReducer = (state, action) => {
    switch(action.type){
        case 'ADD':
        return {
            ...state,
            data: action.results.concat(state.data)
        }
        break
        case  'LOCAL':
        return{
            ...state,
            data: action.results
        }
        break
        default:
        return state
    }
}

function CheckOut(props){
const [barcode, setBarcode] = useState('')
const [show, setShow] = useState(false)
const [results, dispatch] = useReducer(resultsReducer, initialResultsState)
const [processingAlert, setProcessingAlert] = useState(false)
const [processingSuccess, setProcessingSuccess] = useState(false)
const [processingFailure, setProcessingFailure] = useState(false)
const [errorMessage, setErrorMessage] = useState('')
//Handles new 
const [newContainer, setNewContainer] = useState(false)
const [newBarcode, setNewBarcode] = useState('')
const [newBox, setNewBox] = useState('')
const [locationNeeded, setLocationNeeded] = useState(true)
const [loading, setLoading] = useState(false)


const toggle = () => setShow(!show);

useEffect(() => {
    const getLocalItems = async () => {
        const local = await handleLocalStorage('checkout') || []
        dispatch({ type: 'LOCAL', results: local})
    }
    getLocalItems()
},[])


useEffect(() => {
    if(show === true){
        setTimeout(()=>{
            toggle()
        }, 3000)
    }
},[show])

useEffect(() => {
    setTimeout(()=>{
        if(barcode && barcode !== '' && barcode.length === 15){
            setNewContainer(false)
            setLoading(true)
            setTimeout(()=>{
                update()
            },  1000)
        }

        if(barcode === ''){
            setNewContainer(false) 
        }
    },1000) 
},[barcode])

useEffect(() => {
    if(results && results.data && results.data.length > 0){
        localforage.setItem('checkout', results.data)
    }
},[results])

const setCleanBarcode = e => {
    e.preventDefault()
    setBarcode(e.target.value.replace(/\D/g,''))
}

const setNewScannedBarcode = e => {
    e.preventDefault()
    setNewBarcode(e.target.value.replace(/\D/g,''))
}


const update = async () => {
        //First check if barcode is the right length and starts with 310
        if(barcode.length === 15 && barcode.startsWith('310')){
            const updateValue = {
                'container_barcode' : barcode
            }
            //Next check if the barcode exists on the server
            const verifyBarcode = await containers('', 'get-containers', {"container_barcode" : barcode})
            //If it does we can move forward with processing it
            if(verifyBarcode && verifyBarcode.code === 201){
                if(verifyBarcode && verifyBarcode.results && verifyBarcode.results.check_out === null){
                const updateBarcode = await containers(updateValue, 'container-check-out')
                    if(updateBarcode && updateBarcode.code === 201){
                        setBarcode('')
                        setLoading(false)
                        playSuccess()
                        toast.success(`${barcode} successfully checked out`, {
                            position: "top-right",
                            autoClose: 10000,
                            hideProgressBar: false,
                            closeOnClick: true,
                        });
                        dispatch({ type: 'ADD', results: [updateBarcode.results]})
                    } else {
                        setLoading(false)
                        playError()
                        toast.error("There was an error saving this record. Check your internet connection.", {
                            position: "top-right",
                            autoClose: 10000,
                            hideProgressBar: false,
                            closeOnClick: true,
                        });
                    }
                } else {
                    setLoading(false)
                    setBarcode('')
                    playError()
                    toast.error("This record has already been checked out", {
                        position: "top-right",
                        autoClose: 10000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });
                }    
            } else {
                setNewBarcode(barcode)
                setNewContainer(true)
                setLoading(false)
                playError()
                toast.warning("That barcode does not exist. Create a new one", {
                    position: "top-right",
                    autoClose: 10000,
                    hideProgressBar: false,
                    closeOnClick: true,
                })
            }    
        } else {
            setLoading(false)
            playError()
            toast.error("Barcode must be 15 characters long and begin with 310", {
                position: "top-right",
                autoClose: 10000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            // checkOutError('Barcode must be 15 characters long and begin with 310')
        }    
}

const checkOutError = message => {
    setProcessingAlert(false)
    setProcessingFailure(true)
    playError()
    toast.error(message, {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
    });
}


const manualSearch = e => {
    e.preventDefault()
    if(barcode && barcode !== ''){
        setTimeout(()=>{
            update()
        }, 1000)
    } else {
    }
}

const handleEnter = (event) => {
    if (event.keyCode === 13) {
      const form = event.target.form;
      const index = Array.prototype.indexOf.call(form, event.target);
      event.preventDefault();
    }
}    

const handleLocalStorage = async (key) => {
    const results = await localforage.getItem(key)
    return results
}

const manualUpload = async e => {
    e.preventDefault()
    setLoading(true)
    if(newBarcode.length === 15 && newBarcode.startsWith('310')){
        const newContainer = {
            'container_barcode': newBarcode,
            'container_box': newBox,
            'location_needed' : locationNeeded
        }
        const update = await containers(newContainer, 'container-new')
        if(update && update.code === 201){
            setLoading(false)
            setBarcode('')
            setNewBarcode('')
            setNewBox('')
            playSuccess()
            toast.success("Container successfully updated", {
                position: "top-right",
                autoClose: 10000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            setNewContainer(false)
            dispatch({ type: 'ADD', results: [update.results]})
        } else {
            setLoading(false)
            playError()
            toast.error("There was an error creating this record. Check your internet connection.", {
                position: "top-right",
                autoClose: 10000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }
    } else {
        setLoading(false)
        playError()
        toast.error("Barcode must be 15 characters long and begin with 310", {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
        }); 
    }    
}

const [playSuccess] = useSound(SuccessSound)
const [playError] = useSound(ErrorSound)

    return(
        <Fragment>
        <ToastContainer />
        <div className="container-fluid" style={{marginTop: "30px"}}>
            <Row>  
                <Col xs="4">
                    <div className="menu sticky-top p-3 bg-light">
                    <h1 className="display-4">Check Out </h1>
                    <Form>
                        <InputGroup>
                                <Input 
                                    autoFocus={true}
                                    value={barcode} 
                                    placeholder="Enter barcode..." 
                                    bsSize="lg" 
                                    type="text"
                                    onChange={e => setCleanBarcode(e)}
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
                        {newContainer ?
                        <Fragment className="jumbotron">
                            <Label>Create new Container</Label>
                            <NewContainer
                                newBarcode={newBarcode}
                                setNewBarcode={setNewBarcode}
                                newBox={newBox}
                                setNewBox={setNewBox}
                                locationNeeded={locationNeeded}
                                setLocationNeeded={setLocationNeeded}
                                manualUpload={manualUpload}
                                setNewScannedBarcode={setNewScannedBarcode}
                            />
                        </Fragment>    
                        : ''}
                        {/* <div style={{height: "80px"}}>
                        <FormGroup>
                            <Alert style={{display: 'none'}}></Alert>
                            {processingAlert ?
                                <Alert color="warning">Sending data to the server...</Alert>
                            : ''}
                             {processingSuccess ?
                                <Alert color="success">Container updated successfully</Alert>
                            : ''}
                            {processingFailure ?
                                <Alert color="danger">{errorMessage}</Alert>
                            : ''}
                        </FormGroup>    
                        </div>    */}
                    </Form>  
                    </div>
                </Col>
                <Col xs="8">
                <div className="menu sticky-top p-3 bg-light">
                <h1 className="display-4">Check outs results </h1>
                {results && results.data && results.data.length > 0 ?
                    <Table>
                        <thead>
                            <tr>
                                <th>Container Barcode</th>
                                <th>Container</th>
                                <th>Checked Out</th>
                            </tr>
                        </thead>
                        <tbody>
                        {Object.keys(results.data).map((items,idx) =>
                            <tr key={idx}>
                                <td>{results.data[items].container_barcode}</td>
                                <td>{results.data[items].container_box}</td>
                                <td>{results.data[items].check_out}</td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                : ''}
                </div>
                </Col>
             </Row>   
        </div> 
        </Fragment>   
    )
}

const NewContainer = props => {

    const handleEnter = (event) => {
        if (event.keyCode === 13) {
          const form = event.target.form;
          const index = Array.prototype.indexOf.call(form, event.target);
          form.elements[index + 1].focus();
          event.preventDefault();
        }
    }   

    return(
       <Form>
            <FormGroup>
                <Input 
                    autoFocus={true}
                    value={props.newBarcode} 
                    placeholder="Enter new barcode..." 
                    bsSize="lg" 
                    type="text"
                    onChange={e => props.setNewScannedBarcode(e)}
                    onKeyDown={handleEnter}
                />
            </FormGroup> 
            <FormGroup>
                <Label>Location Needed?</Label>
                <Input 
                    value={props.locationNeeded} 
                    bsSize="lg" 
                    type="select"
                    onChange={e => props.setLocationNeeded(e.target.value)}
                    onKeyDown={handleEnter}
                >
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
                </Input>
            </FormGroup> 
            <FormGroup>
                <Input 
                    value={props.newBox} 
                    placeholder="Enter container title..." 
                    bsSize="lg" 
                    type="text"
                    onChange={e => props.setNewBox(e.target.value)}
                    onKeyDown={handleEnter}
                />
            </FormGroup>
            <Button onClick={e => props.manualUpload(e)}>Add new</Button>
       </Form>     
    )
}

export default CheckOut