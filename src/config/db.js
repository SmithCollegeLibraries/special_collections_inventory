import { base, container, location } from './endpoints'
import queryString from 'query-string'

export const containers = async (content = '', type = '', params = {} ) => {
    switch(type){
        case 'get-containers':
        case 'get-containers-locations':
            return get(`${base}${container[type]}${Object.keys(params).length ? `?${queryString.stringify(params)}` : ''}`)
        break
        case 'container-check-out':
        case 'container-check-in':
        case 'container-new':
            return post(`${base}${container[type]}`, content)
        break
    }
}

export const locations = async (content = '', type = '', params = {} ) => {
    switch(type){
        case 'verify-location':
            return get(`${base}${location[type]}${Object.keys(params).length ? `?${queryString.stringify(params)}` : ''}`)
        break
    }
}    

const get = async (string, retries = 5) => {
    try {
        let response = await fetch(string.includes('?') ? `${string}` : `${string}`)
        return responseHandling(response, string,'', 'get', retries) 
    } catch (e) {
        catchError('', e)
    }
}

const post = async (string, content, retries = 5) => {
    try {
        const response = await fetch(string.includes('?') ? `${string}` : `${string}`, {
            method: 'POST',
            body: JSON.stringify(content)
        }) 
        return responseHandling(response, string, content, 'post', retries)
    } catch (e) {
        catchError('', e)
    }
}

const responseHandling = async (response, string, content = '', type, retries) => {
    switch(response.status){
        case 200: 
        case 201:
        case 304:
             return await response.json()
        break;
        case 204:
            return {}
        case 400:
            return await catchError('Bad Request', response.statusText)    
        break;
        case 401:
        case 403:
            return await catchError('Authentication failed', response.statusText)
        break;
        case 404:
            return await catchError("Doesn't exist", response.statusText)
        break;
        case 405: 
            return await catchError('Method not allowed', response.statusText)
        break;
        case 422:
            return await catchError('Data Validation Fail', response.statusText)
        break;
        case 500:
            if(retries === 0){
                return await catchError('Internal Server error', response.statusText)
            } else if(type === 'get'){
                return await get(string, retries - 1);
            } else if(type === 'post'){
                return await post(string, content, retries - 1);
            }
        break;
        default:
            return await catchError('There was an error.  Check your internet connection', '')                      
    }
}

const catchError = (value, e) => {
    const error = {
        name: value,
        message: e
    }
    return console.log(error)
}