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

  const { genres, locations } = useMemo(() => {
    const g = new Set();
    const l = new Set();
    rawData.forEach(r => {
      if (r.Genre) g.add(r.Genre);
      if (r.Location) l.add(r.Location);
    });
    return { genres: Array.from(g), locations: Array.from(l) };
  }, []);

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

  const toggleLang = () => setLang(l => l === 'en' ? 'zh' : 'en');
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const hasTag = useCallback((row, tag) => {
    return row[tag] === "O";
  }, []);

  const filteredData = useMemo(() => {
    let results = [];
    let aliasGenre = aliasing[genre] ? [genre, ...aliasing[genre]] : [genre];
    
    for (let queryGenre of aliasGenre) {
      for (let row of rawData) {
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

    return results;
  }, [genre, location, currentCoord, selectedTags, hasTag]);

  const handleCardClick = (row) => {
    const pos = getPosition(row.Coordinates);
    setActiveMarker(pos);
    setActiveRestaurant(row.Restaurant);
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
          />

          <div className="list-container">
            {filteredData.length === 0 ? (
              <div className="empty-state">{lang === 'en' ? 'No restaurants match the filters' : '無符合條件的餐廳'}</div>
            ) : (
              filteredData.map((row) => (
                <RestaurantCard 
                  key={row.Restaurant} 
                  row={row} 
                  lang={lang} 
                  handleCardClick={handleCardClick} 
                  hasTag={hasTag} 
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
