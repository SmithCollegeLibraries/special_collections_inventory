import React,{ useState, useRef, useEffect } from 'react'
import {
    Navbar,
    NavbarBrand,
    Nav,
    NavItem,
    Button
  } from 'reactstrap';
  import { containers } from '../config/db'
  import { NavLink } from 'react-router-dom'
  import { CSVLink } from "react-csv";

function Header(){
    const [data, setData] = useState([])
    const [exportData, setExportData] = useState([])
    const [exportListData, setExportListData] = useState([])
    const [exportDataButton, setExportDataButton] = useState('Export to CSV')
    const csvLink = useRef()


    useEffect(() => {
        if(exportData && Object.keys(exportData).map(items => items).length > 0){
            const header = Object.keys(exportData).map((items, idx) => 
            Object.keys(exportData[items]).map((sets) => {
                return sets
            }))
    
        const exportLists = Object.keys(exportData).map((items, idx) => 
            Object.keys(exportData[items]).map((sets) => {
                return exportData[items][sets]
        }))
    
        const listExport = header && header.length > 0 ? header[0] : []    

        const lists = [listExport]
        const listData = lists.concat(exportLists)
        setExportListData(listData)

        }
    },[exportData])

    useEffect(() => {
        if(exportListData && exportListData.length > 0 ){
            setExportDataButton('Export Ready')
            setTimeout(()=>{
                setExportDataButton('Export to CSV')
            }, 1000)
            csvLink.current.link.click()
        }
    }, [exportListData])


    const getExportData = async e => {
        setExportDataButton('Preparing Export..')
        const search = await containers('','get-containers-locations')
        if(search && search.code === 201){
            setExportData(search.results)
        }
    }


    return(
        <div>
        <Navbar color="light" light expand="md">
          <NavbarBrand href="/">Special Collections Inventory (Version 1.0.4)</NavbarBrand>
            <Nav className="mr-auto" navbar>
              <NavItem>
                    <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/checkout">Check Out</NavLink>   
              </NavItem>
              <NavItem>
                    <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/primarycheckin">Check In With Location</NavLink>
              </NavItem>
              <NavItem>
                    <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/secondarycheckin">Check In Without Location</NavLink> 
              </NavItem> 
            </Nav>
            <Button color="primary" onClick={e => getExportData(e)}>{exportDataButton}</Button>
                <CSVLink
                    data={exportListData || []}
                    filename={`sc-dataexport${Date.now()}.csv`}
                    className="hidden"
                    ref={csvLink}
                    target="_blank" 
                />
        </Navbar>
      </div>
    )
}

export default Header
