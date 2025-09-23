import React, {useState, useEffect} from 'react'
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

function Alerts(props)
{
    return(
        <Toast isOpen={props.show} style={{position: "absolute", top: "30px", right: "50px"}}>
            <ToastHeader icon={props.alerts && props.alerts.type ? props.alerts.type : 'primary'}>
            {props.alerts && props.alerts.name ? props.alerts.name : ''}
            </ToastHeader>
            <ToastBody>
                {props.alerts && props.alerts.message ? props.alerts.message : ''}
            </ToastBody>
      </Toast>
    )
}

export default Alerts