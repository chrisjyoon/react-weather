// import logo from './logo.svg';
import { useState, useEffect } from 'react';

import './App.css';
import Location, { useGoogleMapAPI } from './location/Location';
import WeatherApi from './weather/WeatherApi';
import WeatherCard from './weather/WeatherCard';

function App() {
  const [uiState, setUiState] = useState({
    step: 0,          // 0 : select location, 1 : weather cards
    loading: 0,       // 0 : not loading, 1 : fetching geolocation, 2 : fetching weather data
    darkMode: false   // dark mode
  });
  const [weatherState, setWeatherState] = useState({
    currIdx: 0,   // active day for showing weather card
    currLoc: '',  // current geo location
    weatherData: []
  });

  console.log('!!! uiState = ', uiState);
  console.log('!!! weatherState = ', weatherState);
  const handlers = initHandlers(uiState, setUiState, weatherState, setWeatherState);
  useGoogleMapAPI(handlers.useLocationHandler);
  useEventListener('keyDown', handlers.keyDownHandler);
  useEffect(() => {
    document.body.style.backgroundColor = uiState.darkMode ? '#222222' : '#cccccc';
  });

  let header = composeHeader(uiState, handlers);
  let location = composeLocation(uiState, handlers.startWithCurrLoc, weatherState.currLoc);
  let weathers = composeWeather(uiState, weatherState, handlers);

  return (
    <div className={`App${uiState.darkMode ? 'Dark' : ''} stage-${uiState.step}`}>
      {header}
      {location}
      {weathers}
    </div>
  );
}

const initHandlers = (uiState, setUiState, weatherState, setWeatherState) => {
  const handlers = {};
  const setUiHandler = (k, v) => {
    setUiState(prevState => {
      return {
        ...prevState,
        [k]: v
      };
    });
  };
  const setWeatherHandler = (k, v) => {
    setWeatherState(prevState => {
      return {
        ...prevState,
        [k]: v
      };
    });
  };
  handlers.goHome = () => {
    setUiState({
      step: 0,
      loading: 0,
      darkMode: uiState.darkMode
    });
    setWeatherState({
      currIdx: 0,
      currLoc: '',
      weatherData: [],
    });
    window.google = undefined;
  }
  handlers.goDark = (checked) => {
    setUiHandler('darkMode', !uiState.darkMode);
  }
  handlers.useLocationHandler = (latitude, longitude, geoLoc) => {
    setWeatherHandler('currLoc', geoLoc);
    setUiHandler('loading', 2);;
    getWeather(latitude, longitude);
  }
  handlers.startWithCurrLoc = async() => {
    try {
      const [pos, geoLoc] = await Location.getCurrentLocation((loading) => {
        setUiHandler('loading', loading);
      });
      setWeatherHandler('currLoc', geoLoc);
      getWeather(pos.latitude, pos.longitude);
    } catch (e) {
      console.warn(e.message);
      alert('Could not retrieve your current location, please check you allowed location service for your browser');
      setUiHandler('loading', 0);
    }
  }
  const KEY_LEFT = 37;
  const KEY_RIGHT = 39;
  handlers.keyDownHandler = (evt) => {
    if (evt.keyCode === KEY_RIGHT && weatherState.currIdx < weatherState.weatherData.length - 1) {
      setWeatherHandler('currIdx', weatherState.currIdx + 1);
      return;
    }
    if (evt.keyCode === KEY_LEFT && weatherState.currIdx > 0) {
      setWeatherHandler('currIdx', weatherState.currIdx - 1);
    }
  }
  handlers.navHandler = (pos) => {
    if (pos === 'next' && weatherState.currIdx < weatherState.weatherData.length - 1) {
      setWeatherHandler('currIdx', weatherState.currIdx + 1);
      return;
    }
    if (pos === 'prev' && weatherState.currIdx > 0) {
      setWeatherHandler('currIdx', weatherState.currIdx - 1);
    }
  }
  const getWeather = async (latitude, longitude) => {
    try {
      const weatherData = await WeatherApi.getWeather(latitude, longitude);
      setWeatherHandler('weatherData', weatherData);
      setUiHandler('step', 1);
    } catch (e) {
      console.warn(e.message);
    }
  }
  return handlers;
}

function useEventListener(eventName, handler, element = window) {
  useEffect(() => {
    element.addEventListener('keydown', handler);
    return () => element.removeEventListener('keydown', handler);
  }, [eventName, handler, element]);
}

function composeHeader(uiState, handlers) {
  if (uiState.step === 1) {
    setTimeout(() => {
      document.getElementById('guide').className = 'fadeOut';
    }, 1000);
  }
  return uiState.step === 0 ? (
    <div>
      <h1>Welcome to Weather widget</h1>
    </div>
  ) : (
    <div className="headerWidget">
      <div className="headerLeft">
        <button className="btnHome" onClick={handlers.goHome}>Go Home</button>
        <label className="container">Dark Mode
          <input type="checkbox" checked={uiState.darkMode} onChange={handlers.goDark}/>
          <span className="checkmark"></span>
        </label>
      </div>
      <p id="guide" className="fadeIn">You can navigate by arrow key on your keyboard or click the weather card</p>
    </div>
  );
}
function composeLocation(uiState, startWithCurrLoc, currLoc) {
  let location = null;
  if (uiState.step === 0) {
    switch (uiState.loading) {
      case 0:
        location = (
          <div>
            <input
              id="address"
              className="inputLocation"
              type="text"
              placeholder="Type name of the city"
            ></input>
            &nbsp;<span>OR</span>&nbsp;
            <button className="btnStart" onClick={startWithCurrLoc}>
              Use Current Location
            </button>
            <img
              className="googleLogo"
              src={`/${uiState.darkMode ? 'powered_by_google_dark.png' : 'powered_by_google.png'}`}
              alt="powered by google logo"
            ></img>
          </div>
        );
        break;
      case 1:
        location = (
          <div>getting your current location..</div>
        );
      break;
      case 2:
        location = (
          <div>loading weather for {currLoc}</div>
        );
      break;
      default:
        location = null;
    }
  }
  return location;
}
function composeWeather(uiState, weatherState, handler) {
  const MAX_CARD_NUM = 3; // number of cards to display
  // initially we show two cards (today, tomorrow),
  // and after that, we show three cards (yesterday, today, tomorrow)
  let startIdx = weatherState.currIdx === 0 ? 0 : weatherState.currIdx - 1;
  let cards = weatherState.weatherData.slice(startIdx, weatherState.currIdx === 0 ? 2 : startIdx + MAX_CARD_NUM);

  return uiState.step === 0 ? null : (
    <div>
      {cards.map((weather) => {
        return (
          <WeatherCard
            index={weather.index}
            currIdx={weatherState.currIdx}
            currLoc={weatherState.currLoc}
            day={weather.day}
            date={weather.date}
            weather={weather.weather}
            temp={weather.temp}
            others={weather.others}
            key={weather.key}
            navHandler={handler.navHandler}
            darkMode={uiState.darkMode}
          ></WeatherCard>
        );
      })}
    </div>
  );
}

export default App;
