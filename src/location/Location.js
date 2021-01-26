import { useEffect } from 'react';
import axios from 'axios';

const GOOGLE_MAP_API_KEY = 'your api key';
// class for using place autocomplete, geocode from google and navigator.geolocation api.
export default class Location {
  currLocation;
  // with given latitude and longitude, fetch the geocode data by using google map api
  static getGeoCode = async (loc) => {
    try {
      const geocode = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=${GOOGLE_MAP_API_KEY}`
      )
      const pluscode = geocode.data.plus_code
        ? geocode.data.plus_code
        : geocode.data.results[0].plus_code;
      const regex = /.+?\s(.+)/;
      const matches = pluscode.compound_code.match(regex);
      return matches ? matches[1] : geocode.data.results[0].formatted_address;
    } catch (e) {
      console.warn(e);
    }
  };
  // get browser's current location. (user should allow location service in both device and browser)
  static getCurrentLocation = (startCallback) => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      };
      startCallback(1);
      navigator.geolocation.getCurrentPosition(async (pos) => {
        startCallback(2);
        this.currLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }
        const geoCode = await this.getGeoCode(this.currLocation);
        resolve([this.currLocation, geoCode]);
      }, (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`)
        reject(err);
      }, options);
    });
  };
}
// apply places autocomplete by using google map place api
const useGoogleMapAPI = (handler) => {
  useEffect(() => {
    if (window.google) return;
    // Load the Google Maps API only it's not loaded yet
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_API_KEY}&callback=initMap&libraries=places`;
    script.async = true;
    document.body.appendChild(script);
    window.initMap = () => {
      console.info('google map api loaded!');
      const address = document.getElementById('address');
      const options = {
        types: ['(regions)']
      };
      const autocomplete = new window.google.maps.places.Autocomplete(address, options);
      autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        handler(latitude, longitude, place.formatted_address);
      });
    };
  });
}

export { useGoogleMapAPI };