import React from 'react';
import './Footer.css';

export default function Footer({ lang }) {
  return (
    <footer className="app-footer">
      <a href="https://docs.google.com/spreadsheets/d/1k7IUK_FrCZbTatBzo8tfCVHp7Xrc1764eFq2fBQuScg/edit" className="footer-link">
        {lang === 'en' ? 'Edit restaurants' : '編輯餐廳'}
      </a>
      <span style={{color: '#bbb'}}>|</span>
      <a href="https://github.com/hahachou/tpe-zhongshan-food" className="footer-link">GitHub Repo</a>
    </footer>
  );
}
