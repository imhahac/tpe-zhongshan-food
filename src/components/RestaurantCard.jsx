import React from 'react';
import './RestaurantCard.css';
import { 
  genreMapping, locationMapping, filterMapping, 
  genreMapping_en, locationMapping_en, filterMapping_en 
} from '../data/enum.js';
import { getPosition } from '../utils/helpers.js';

export default function RestaurantCard({ row, isHotPick, lang, handleCardClick, hasTag }) {
  const pos = getPosition(row.Coordinates);
  const encodedName = encodeURIComponent(row.Restaurant);
  const gMapsLink = `https://www.google.com/maps/search/${encodedName}/@${pos[0]},${pos[1]},17z`;

  return (
    <div className={`row-card ${isHotPick ? 'hot-pick' : ''}`} onClick={() => handleCardClick(row)}>
      <h3>
        <a href={gMapsLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
          {row.Restaurant}
        </a>
      </h3>
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
