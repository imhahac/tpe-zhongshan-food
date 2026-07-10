import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import Filters from './components/Filters';
import RestaurantCard from './components/RestaurantCard';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import Map from './components/Map';

import rawData from './data/data.json';
import { aliasing } from './data/aliasing.js';
import { apiFetch, inRange, getPosition, NEAR, BACKEND_BASE_URL } from './utils/helpers.js';

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'zh');
  const [hotPicks, setHotPicks] = useState({});
  const [genre, setGenre] = useState(localStorage.getItem('genre') || 'All');
  const [location, setLocation] = useState(localStorage.getItem('location') || 'All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentCoord, setCurrentCoord] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const viewFired = useRef(false);

  // Available genres and locations from data
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
    apiFetch("/select", { type: genre, location: location });
  }, [genre, location]);

  useEffect(() => {
    if (!viewFired.current) {
      apiFetch("/view", { time: Math.floor(Date.now() / 1000) });
      viewFired.current = true;
    }
    fetch(`${BACKEND_BASE_URL}/hot`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const hp = {};
        for (let r of data) {
          if (r.restaurant && r.percentage) hp[r.restaurant] = r.percentage;
        }
        setHotPicks(hp);
      })
      .catch(err => console.warn("Hot picks error", err));

    // Geolocation
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
    if (tag === "HotPick") return row.Restaurant && hotPicks[row.Restaurant];
    return row[tag] === "O";
  }, [hotPicks]);

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

    // Shuffle
    results.sort(() => Math.random() - 0.5);
    return results;
  }, [genre, location, currentCoord, selectedTags, hasTag]);

  const handleCardClick = (row) => {
    const pos = getPosition(row.Coordinates);
    setActiveMarker(pos);
    apiFetch("/click", { restaurant_name: row.Restaurant, order: 1 });
  };

  const handleScroll = (e) => {
    setShowBackToTop(e.target.scrollTop > 100);
  };

  const scrollToTop = () => {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
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
    <>
      <Header lang={lang} toggleLang={toggleLang} />

      <div className="content-wrapper">
        <div className="main-content" onScroll={handleScroll}>
          <Filters 
            lang={lang} 
            genre={genre} setGenre={setGenre}
            location={location} setLocation={setLocation}
            genres={genres} locations={locations}
            selectedTags={selectedTags} toggleTag={toggleTag} setSelectedTags={setSelectedTags}
          />

          <div className="list-container">
            {filteredData.length === 0 ? (
              <div>{lang === 'en' ? 'No restaurants match the filters' : '無符合條件的餐廳'}</div>
            ) : (
              filteredData.map((row, idx) => (
                <RestaurantCard 
                  key={idx} 
                  row={row} 
                  isHotPick={hotPicks[row.Restaurant]} 
                  lang={lang} 
                  handleCardClick={handleCardClick} 
                  hasTag={hasTag} 
                />
              ))
            )}
          </div>
          
          <div style={{fontSize:'0.9em', color:'#888', marginBottom:'12px'}}>
            {lang === 'en' ? 'Note: Map coordinates may be inaccurate. Click the restaurant name to view Google Maps.' : '註：地圖位置不一定準確，詳細內容請點擊下方卡片餐廳名稱連入 Google Maps 查看'}
          </div>
        </div>

        <div className="map-container">
          <Map 
            currentCoord={currentCoord} 
            activeMarker={activeMarker}
            markers={filteredData.map(r => ({
              position: getPosition(r.Coordinates),
              name: r.Restaurant
            }))} 
          />
        </div>
      </div>

      <Footer lang={lang} />
      <BackToTop show={showBackToTop} lang={lang} scrollToTop={scrollToTop} />
    </>
  );
}
