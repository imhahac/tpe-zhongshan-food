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
  showFavoritesOnly, setShowFavoritesOnly,
  sortBy, setSortBy,
  totalCount, filteredCount,
  pickHistory, handleCardClick, safeRawData
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
        <div className="input-group">
          <label>{lang === 'en' ? 'Sort By:' : '排序方式：'}</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">{lang === 'en' ? 'Default' : '預設順序'}</option>
            <option value="distance">{lang === 'en' ? '🚶 Nearest Distance' : '🚶 距離最近'}</option>
            <option value="rating">{lang === 'en' ? '⭐ Highest Rating' : '⭐ 評價最高'}</option>
            <option value="price">{lang === 'en' ? '🪙 Lowest Price' : '🪙 價格由低到高'}</option>
          </select>
        </div>
      </div>

      <div className="filter-stats-bar">
        <span className="count-badge">
          {lang === 'en' ? `Showing ${filteredCount} / ${totalCount}` : `顯示中：${filteredCount} / ${totalCount} 間`}
        </span>
        {(genre !== 'All' || location !== 'All' || selectedTags.length > 0 || showFavoritesOnly || sortBy !== 'default') && (
          <button className="reset-link-btn" onClick={() => {
            setGenre('All');
            setLocation('All');
            setSelectedTags([]);
            setShowFavoritesOnly(false);
            setSortBy('default');
          }}>
            {lang === 'en' ? 'Reset All Filters' : '↺ 重置所有篩選'}
          </button>
        )}
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

      {pickHistory && pickHistory.length > 0 && (
        <div className="pick-history-bar">
          <span className="history-label">{lang === 'en' ? 'Recent Picks:' : '最近抽中：'}</span>
          {pickHistory.map((name, i) => (
            <button 
              key={`${name}-${i}`} 
              className="history-pill"
              onClick={() => {
                const target = safeRawData.find(r => r && r.Restaurant === name);
                if (target && handleCardClick) {
                  handleCardClick(target);
                  document.getElementById(`card-${target.Restaurant}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              🎯 {name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
