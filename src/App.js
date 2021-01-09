// import logo from './logo.svg';
import { useState, useEffect } from 'react';

import './App.css';
import Location, { useGoogleMapAPI } from './location/Location';
import WeatherApi from './weather/WeatherApi';
import WeatherCard from './weather/WeatherCard';

let weatherData = [];

function App() {
  const [stage, setStage] = useState(0); // 0 : select location, 1 : weather cards
  const [loading, setLoading] = useState(0); // 0 : not loading, 1 : fetching geolocation, 2 : fetching weather data
  const [currIdx, setCurrIdx] = useState(0); // active day for showing weather card
  const [currLoc, setCurrLoc] = useState(''); // current geo location

  const handlers = initHandlers(setStage, setLoading, setCurrIdx, setCurrLoc, currIdx);
  useGoogleMapAPI(handlers.useLocationHandler);
  useEventListener('keyDown', handlers.keyDownHandler);

  let header = composeHeader(stage, handlers);
  let location = composeLocation(stage, loading, handlers.startWithCurrLoc, currLoc);
  let weathers = composeWeather(stage, currIdx, currLoc, setCurrIdx);

  return (
    <div className={`App stage-${stage}`}>
      {header}
      {location}
      {weathers}
    </div>
  );
}

const initHandlers = (setStage, setLoading, setCurrIdx, setCurrLoc, currIdx) => {
  const handlers = {};
  handlers.goHome = () => {
    setStage(0);
    setLoading(0);
    setCurrIdx(0);
    setCurrLoc('');
    window.google = undefined;
  }
  handlers.useLocationHandler = (latitude, longitude, geoLoc) => {
    setCurrLoc(geoLoc);
    setLoading(2);
    getWeather(latitude, longitude);
  }
  handlers.startWithCurrLoc = async() => {
    try {
      const [pos, geoLoc] = await Location.getCurrentLocation(setLoading);
      setCurrLoc(geoLoc);
      getWeather(pos.latitude, pos.longitude);
    } catch (e) {
      console.warn(e.message);
      alert('Could not retrieve your current location, please check you allowed location service for your browser');
      setLoading(0);
    }
  }
  const KEY_LEFT = 37;
  const KEY_RIGHT = 39;
  handlers.keyDownHandler = (evt) => {
    if (evt.keyCode === KEY_RIGHT && currIdx < weatherData.length - 1) {
      setCurrIdx(currIdx + 1);
      return;
    }
    if (evt.keyCode === KEY_LEFT && currIdx > 0) {
      setCurrIdx(currIdx - 1);
    }
  }
  const getWeather = async (latitude, longitude) => {
    try {
      weatherData = await WeatherApi.getWeather(latitude, longitude);
      console.log(weatherData);
      setStage(1);
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

function composeHeader(stage, handlers) {
  return stage === 0 ? (
    <div>
      <h2>Welcome to Weather widget</h2>
    </div>
  ) : (
    <div className="headerWidget">
      <button className="btnHome" onClick={handlers.goHome}>Go Home</button>
      <p>You can navigate by arrow key on your keyboard or click the weather card</p>
    </div>
  );
}
function composeLocation(stage, loading, startWithCurrLoc, currLoc) {
  let location = null;
  if (stage === 0) {
    switch (loading) {
      case 0:
        location = (
          <div>
            <input
              id="address"
              className="inputLocation"
              type="text"
              placeholder="Type name of the city"
            ></input>
            &nbsp;OR&nbsp;
            <button className="btnStart" onClick={startWithCurrLoc}>
              Use Current Location
            </button>
            <img
              className="googleLogo"
              src="/powered_by_google.png"
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
function composeWeather(stage, currIdx, currLoc, setCurrIdx) {
  const MAX_CARD_NUM = 3; // number of cards to display
  // initially we show two cards (today, tomorrow),
  // and after that, we show three cards (yesterday, today, tomorrow)
  let startIdx = currIdx === 0 ? 0 : currIdx - 1;
  let cards = weatherData.slice(startIdx, currIdx === 0 ? 2 : startIdx + MAX_CARD_NUM);
  console.log('cards = ', cards);
  const navHandler = (pos) => {
    if (pos === 'next' && currIdx < weatherData.length - 1) {
      setCurrIdx(currIdx + 1);
      return;
    }
    if (pos === 'prev' && currIdx > 0) {
      setCurrIdx(currIdx - 1);
    }
  }

  return stage === 0 ? null : (
    <div>
      {cards.map((weather) => {
        return (
          <WeatherCard
            index={weather.index}
            currIdx={currIdx}
            currLoc={currLoc}
            day={weather.day}
            date={weather.date}
            weather={weather.weather}
            temp={weather.temp}
            others={weather.others}
            key={weather.key}
            navHandler={navHandler}
          ></WeatherCard>
        );
      })}
    </div>
  );
}

export default App;
