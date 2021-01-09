// import { useState } from 'react';
import './WeatherCard.css';

const WeatherCard = (props) => {
  console.log('props = ', props);
  // const active = isActive ? 'active' : 'none'; 
  const position =
    +props.index === props.currIdx
      ? 'active'
      : +props.index < props.currIdx
      ? 'prev'
      : 'next';
  const iconUrl = `http://openweathermap.org/img/wn/${props.weather.icon}@2x.png`;

  return (
    <div
      className={`weatherCard${props.darkMode ? 'Dark' : ''} ${position}`}
      onClick={(evt) => {
        props.navHandler(position);
      }}
    >
      <div className="contents">
        <div className="header">
          <div className="day">{props.day}</div>
          <div className="date">{props.date}</div>
        </div>
        <p className="main">{props.weather.main}</p>
        <div className="iconAndTemp">
          <img className="icon" src={iconUrl} alt="weahter icon"></img>
          {props.index === 0 ? (
            <div className="temp">{props.temp.curr}&#8451;</div>
          ) : (
            <div className="tempMinMax">
              <span className="max">{props.temp.max}&#8451;</span>
              <span className="min">{props.temp.min}&#8451;</span>
            </div>
          )}
        </div>
        {position === 'active' ? (
          <div className="aciveFooter">
            <div className="others">
              <span>SunRise: {props.others.sunrise}</span>
              <span>SunSet: {props.others.sunset}</span>
            </div>
            <div className="others">
              <span>Humidity: {props.others.humidity}%</span>
              <span>Wind: {props.others.windspeed}m/s</span>
            </div>
            <p className="location">{props.currLoc}</p>
          </div>
        ) : ''
        }
        
      </div>
    </div>
  );
}

export default WeatherCard;