import React from 'react';
import './Filters.css';
import { 
  genreMapping, locationMapping, filterMapping, 
  genreMapping_en, locationMapping_en, filterMapping_en 
} from '../data/enum.js';

export default function Filters({
  lang,
  genre, setGenre,
  location, setLocation,
  genres, locations,
  selectedTags, toggleTag, setSelectedTags,
  showFavoritesOnly, setShowFavoritesOnly
}) {
  return (
    <>
      <div className="form-container">
        <div className="input-group">
          <label>{lang === 'en' ? 'Genre:' : '餐廳類別：'}</label>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="All">{lang === 'en' ? 'All' : '全部'}</option>
            {genres.map(g => (
              <option key={g} value={g}>
                {lang === 'en' ? genreMapping_en[g] || g : genreMapping[g] || g}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>{lang === 'en' ? 'Location:' : '餐廳位置：'}</label>
          <select value={location} onChange={e => setLocation(e.target.value)}>
            <option value="All">{lang === 'en' ? 'All' : '全部'}</option>
            <option value="near">{lang === 'en' ? 'Nearby' : '附近'}</option>
            {locations.map(l => (
              <option key={l} value={l}>
                {lang === 'en' ? locationMapping_en[l] || l : locationMapping[l] || l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filters-div">
        <button 
          className={`filter-btn ${showFavoritesOnly ? 'active-filter' : ''}`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          ⭐ {lang === 'en' ? 'My Favorites' : '我的最愛'}
        </button>
        {Object.entries(filterMapping).map(([tag, { chinese, emoji }]) => {
          const name = lang === 'en' && filterMapping_en[tag] ? filterMapping_en[tag].english : chinese;
          return (
            <button 
              key={tag} 
              className={`filter-btn ${selectedTags.includes(tag) ? 'active-filter' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {emoji} {name}
            </button>
          );
        })}
        <button className="filter-btn" onClick={() => {
          setSelectedTags([]);
          setShowFavoritesOnly(false);
        }}>❌</button>
      </div>
    </>
  );
}
