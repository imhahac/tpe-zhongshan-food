import React from 'react';
import './Header.css';

export default function Header({ lang, toggleLang }) {
  return (
    <header className="app-header">
      <img src="/logo.png" alt="" width="0" height="0" style={{display:'none'}} />
      <img src="/icon.png" alt="ZhongshanFood icon" className="header-icon" />
      <div className="title-div">ZhongshanFood</div>
      <button className="langToggle" onClick={toggleLang}>
        {lang === 'en' ? '中文' : 'EN'}
      </button>
    </header>
  );
}
