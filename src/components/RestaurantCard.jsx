import React from 'react';
import './RestaurantCard.css';
import { 
  genreMapping, locationMapping, filterMapping, 
  genreMapping_en, locationMapping_en, filterMapping_en 
} from '../data/enum.js';
import { getPosition, getDistance } from '../utils/helpers.js';

export default function RestaurantCard({ row, lang, handleCardClick, hasTag, currentCoord, isFavorite, toggleFavorite }) {
  const pos = getPosition(row.Coordinates);
  const encodedName = encodeURIComponent(row.Restaurant);
  
  let gMapsLink = `https://www.google.com/maps/search/${encodedName}/@${pos[0]},${pos[1]},17z`;
  if (currentCoord) {
    gMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${currentCoord[0]},${currentCoord[1]}&destination=${pos[0]},${pos[1]}&travelmode=walking`;
  }

  return (
    <div id={`card-${row.Restaurant}`} className="row-card" onClick={() => handleCardClick(row)}>
      <div className="card-header">
        <h3>
          <a href={gMapsLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
            {row.Restaurant}
          </a>
        </h3>
        <button 
          className="favorite-btn" 
          onClick={(e) => toggleFavorite(row.Restaurant, e)}
          title={lang === 'en' ? 'Add to Favorites' : '加入我的最愛'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      {row.Rating && (
        <div className="card-rating">⭐ {row.Rating}</div>
      )}
      {currentCoord && (
        <div className="card-distance">
          🚶 {lang === 'en' ? 'Distance:' : '距離您'} {Math.round(getDistance(currentCoord, pos) * 1000)}m
        </div>
      )}
      <div>
        {lang === 'en' ? 'Location:' : '區域：'} 
        {lang === 'en' ? locationMapping_en[row.Location] || row.Location : locationMapping[row.Location] || row.Location}
      </div>
      <div>
        {lang === 'en' ? 'Genre:' : '類別：'} 
        {lang === 'en' ? genreMapping_en[row.Genre] || row.Genre : genreMapping[row.Genre] || row.Genre}
      </div>
      <div>
        {lang === 'en' ? 'Price:' : '價格：'} 
        {"🪙".repeat(parseInt(row.Price) || 0)}
      </div>
      {row.Phone && (
        <div className="card-phone">📞 {row.Phone}</div>
      )}
      {row.OpeningHours && (
        <details className="card-hours">
          <summary>{lang === 'en' ? '🕒 Opening Hours' : '🕒 營業時間'}</summary>
          <pre>{row.OpeningHours}</pre>
        </details>
      )}
      <div>
        {Object.keys(filterMapping).map(tag => {
          if (hasTag(row, tag)) {
            const f = filterMapping[tag];
            const fen = filterMapping_en[tag];
            const title = lang === 'en' && fen ? fen.english : f.chinese;
            return <span key={tag} className="tag" title={title}>{f.emoji}</span>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
