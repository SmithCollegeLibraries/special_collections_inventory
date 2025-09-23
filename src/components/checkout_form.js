import React from 'react'
import { Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';


function CheckOutForm(props)
{
    return(
       <Form>
           <FormGroup>
                <Input 
                    autoFocus
                    value={props.barcode} 
                    placeholder="Enter barcode..." 
                    bsSize="lg" 
                    onChange={e => props.setBarcode(e.target.value)}
                    onKeyDown={props.handleEnter}
                    ref={props.inputRef}
                />
           </FormGroup>    
            <Button color="primary" onClick={e => props.manualSearch(e)}>Update</Button>
       </Form>    
    )
}

export default CheckOutForm