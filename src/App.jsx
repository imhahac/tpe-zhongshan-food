import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Filters from './components/Filters';
import RestaurantCard from './components/RestaurantCard';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import Map from './components/Map';

import rawData from './data/data.json';
import { aliasing } from './data/aliasing.js';
import { inRange, getPosition, NEAR } from './utils/helpers.js';

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'zh');
  const [genre, setGenre] = useState(localStorage.getItem('genre') || 'All');
  const [location, setLocation] = useState(localStorage.getItem('location') || 'All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentCoord, setCurrentCoord] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickingName, setPickingName] = useState('');
  
  const [favorites, setFavorites] = useState(() => {
    try {
      const item = localStorage.getItem('favorites');
      const parsed = item ? JSON.parse(item) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const safeRawData = useMemo(() => Array.isArray(rawData) ? rawData : [], []);

  const { genres, locations } = useMemo(() => {
    const g = new Set();
    const l = new Set();
    safeRawData.forEach(r => {
      if (r && r.Genre) g.add(r.Genre);
      if (r && r.Location) l.add(r.Location);
    });
    return { genres: Array.from(g), locations: Array.from(l) };
  }, [safeRawData]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('genre', genre);
    localStorage.setItem('location', location);
  }, [genre, location]);

  useEffect(() => {
    const geoId = navigator.geolocation.watchPosition((pos) => {
      setCurrentCoord([pos.coords.latitude, pos.coords.longitude]);
    }, err => console.warn(err), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(geoId);
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((restaurantName, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(restaurantName) 
        ? prev.filter(n => n !== restaurantName) 
        : [...prev, restaurantName]
    );
  }, []);

  const toggleLang = () => setLang(l => l === 'en' ? 'zh' : 'en');
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const hasTag = useCallback((row, tag) => {
    return row[tag] === "O" || row[tag] === "o";
  }, []);

  const filteredData = useMemo(() => {
    let results = [];
    let aliasGenre = aliasing && aliasing[genre] ? [genre, ...aliasing[genre]] : [genre];
    
    for (let queryGenre of aliasGenre) {
      for (let row of safeRawData) {
        if (!row) continue;
        if (queryGenre !== row.Genre && queryGenre !== "All") continue;
        
        if (location === "near") {
          if (!currentCoord || !inRange(currentCoord, getPosition(row.Coordinates), NEAR)) continue;
        } else if (location !== row.Location && location !== "All") {
          continue;
        }
        results.push(row);
      }
    }

    if (selectedTags.length > 0) {
      results = results.filter(r => selectedTags.every(t => hasTag(r, t)));
    }

    if (showFavoritesOnly) {
      const favs = Array.isArray(favorites) ? favorites : [];
      results = results.filter(r => r && favs.includes(r.Restaurant));
    }

    return results;
  }, [genre, location, currentCoord, selectedTags, hasTag, showFavoritesOnly, favorites, safeRawData]);

  const handleCardClick = useCallback((row, updateHash = true) => {
    if (!row) return;
    const pos = getPosition(row.Coordinates);
    setActiveMarker(pos);
    setActiveRestaurant(row.Restaurant);
    if (updateHash) {
      window.history.pushState(null, null, `#${encodeURIComponent(row.Restaurant)}`);
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.substring(1));
      } catch (e) {
        console.warn("Invalid hash URI encoding");
        return;
      }
      
      if (hash) {
        const target = safeRawData.find(r => r && r.Restaurant === hash);
        if (target) {
          handleCardClick(target, false);
          setTimeout(() => {
            document.getElementById(`card-${target.Restaurant}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleCardClick]);

  const pickRandom = () => {
    if (filteredData.length === 0) return;
    setPicking(true);
    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randIndex = Math.floor(Math.random() * filteredData.length);
      setPickingName(filteredData[randIndex].Restaurant);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const finalChoice = filteredData[randIndex];
        setPicking(false);
        handleCardClick(finalChoice);
        setTimeout(() => {
          document.getElementById(`card-${finalChoice.Restaurant}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }, 100);
  };

  const handleScroll = (e) => {
    setShowBackToTop(e.target.scrollTop > 100);
  };

  const scrollToTop = () => {
    document.querySelector('.sidebar-scrollable')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleWinScroll = () => {
      if (window.innerWidth < 900) {
        setShowBackToTop(window.scrollY > 100);
      }
    };
    window.addEventListener('scroll', handleWinScroll);
    return () => window.removeEventListener('scroll', handleWinScroll);
  }, []);

  return (
    <div className="app-container">
      <div className="map-layer">
        <Map 
          currentCoord={currentCoord} 
          activeMarker={activeMarker}
          activeRestaurant={activeRestaurant}
          markers={filteredData.map(r => ({
            position: getPosition(r.Coordinates),
            name: r.Restaurant
          }))} 
        />
      </div>

      <div className="sidebar-layer">
        <Header lang={lang} toggleLang={toggleLang} />
        
        <div className="sidebar-scrollable" onScroll={handleScroll}>
          <Filters 
            lang={lang} 
            genre={genre} setGenre={setGenre}
            location={location} setLocation={setLocation}
            genres={genres} locations={locations}
            selectedTags={selectedTags} toggleTag={toggleTag} setSelectedTags={setSelectedTags}
            showFavoritesOnly={showFavoritesOnly} setShowFavoritesOnly={setShowFavoritesOnly}
          />

          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <button 
              className="filter-btn active-filter" 
              style={{ width: '90%', fontSize: '1.1rem', padding: '10px', animation: picking ? 'pulse 0.5s infinite' : 'none' }}
              onClick={pickRandom} 
              disabled={picking || filteredData.length === 0}
            >
              {picking 
                ? `🎲 ${pickingName}` 
                : (lang === 'en' ? '🎲 Pick for Me' : '🎲 今天吃什麼？')}
            </button>
          </div>

          <div className="list-container">
            {filteredData.length === 0 ? (
              <div className="empty-state">{lang === 'en' ? 'No restaurants match the filters' : '無符合條件的餐廳'}</div>
            ) : (
              filteredData.map((row, idx) => (
                <RestaurantCard 
                  key={`${row.Restaurant}-${idx}`} 
                  row={row} 
                  lang={lang} 
                  handleCardClick={handleCardClick} 
                  hasTag={hasTag} 
                  currentCoord={currentCoord}
                  isFavorite={favorites.includes(row.Restaurant)}
                  toggleFavorite={toggleFavorite}
                />
              ))
            )}
          </div>
          
          <div className="note-text">
            {lang === 'en' ? 'Note: Map coordinates may be inaccurate. Click the restaurant name to view Google Maps.' : '註：地圖位置不一定準確，詳細內容請點擊下方卡片連入 Google Maps 查看'}
          </div>
        </div>

        <Footer lang={lang} />
      </div>

      <BackToTop show={showBackToTop} lang={lang} scrollToTop={scrollToTop} />
    </div>
  );
}
