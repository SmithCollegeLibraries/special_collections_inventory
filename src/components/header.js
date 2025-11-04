import React, { useState, useRef, useEffect } from 'react';
import {
    Navbar,
    NavbarBrand,
    Nav,
    NavItem,
    Button
  } from 'reactstrap';
import { containers } from '../config/db';
import { NavLink } from 'react-router-dom';
import { CSVLink } from "react-csv";

function Header() {
  const [data, setData] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [exportListData, setExportListData] = useState([]);
  const [exportDataButton, setExportDataButton] = useState('Export to CSV');
  const csvLink = useRef();

  useEffect(() => {
    if (exportData && Object.keys(exportData).map(items => items).length > 0) {
      const header = Object.keys(exportData).map((items, idx) =>
        Object.keys(exportData[items]).map((sets) => {
          return sets;
        }));

      const exportLists = Object.keys(exportData).map((items, idx) =>
        Object.keys(exportData[items]).map((sets) => {
          return exportData[items][sets];
      }))

      // Sort by the 5th column (index 4) descending -- this is the "Last checked in" date
      exportLists.sort((a, b) => {
        const valA = a[4];
        const valB = b[4];

        // Try numeric comparison first
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA; // descending
        }

        // Fallback to locale string comparison (descending)
        const sA = (valA == null ? '' : String(valA));
        const sB = (valB == null ? '' : String(valB));
        return sB.localeCompare(sA, undefined, { numeric: true, sensitivity: 'base' });
      });

      const listExport = header && header.length > 0 ? header[0] : [];

      const lists = [listExport];
      const listData = lists.concat(exportLists);
      setExportListData(listData);
    }
  }, [exportData]);

  const getExportData = async e => {
    setExportDataButton('Downloading...');
    const search = await containers('', 'get-containers-locations');
    if (search && search.code === 201) {
      setExportData(search.results);
    }
    csvLink.current.link.click();
    setExportDataButton('CSV downloaded');
  }

  return (
    <div>
      <Navbar color="light" light expand="md">
        <NavbarBrand href="/">Special Collections Inventory (Version 1.1.0)</NavbarBrand>
        <Nav className="mr-auto" navbar>
          <NavItem>
            <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/">Check in</NavLink>
          </NavItem>
          {/* <NavItem>
            <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/checkout">Check out</NavLink>
          </NavItem>
          <NavItem>
            <NavLink className="nav-link" activeStyle={{ color: '#007BFF' }} to="/secondarycheckin">Check in without location</NavLink>
          </NavItem> */}
        </Nav>
        <Button color={exportDataButton === "CSV downloaded" ? "secondary" : "primary"} onClick={e => getExportData(e)}>{exportDataButton}</Button>
          <CSVLink
            data={exportListData || []}
            filename={`sc-dataexport-${(() => {
              const d = new Date();
              const pad = n => String(n).padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}--${pad(d.getHours())}${pad(d.getMinutes())}`;
            })()}.csv`}
            className="hidden"
            ref={csvLink}
            target="_blank"
          />
      </Navbar>
    </div>
  )
}

export default Header;
