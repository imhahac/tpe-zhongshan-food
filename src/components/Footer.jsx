import React from 'react';
import './Footer.css';

export default function Footer({ lang }) {
  // Use VITE_SHEET_ID from GitHub Actions, or fallback to the original ID if testing locally without .env
  const sheetId = import.meta.env.VITE_SHEET_ID || '1k7IUK_FrCZbTatBzo8tfCVHp7Xrc1764eFq2fBQuScg';
  const repoPath = import.meta.env.VITE_GITHUB_REPO || 'hahachou/tpe-zhongshan-food';
  const repoLink = `https://github.com/${repoPath}`;

  return (
    <footer className="app-footer">
      <a href={sheetLink} className="footer-link" target="_blank" rel="noreferrer">
        {lang === 'en' ? 'Edit restaurants' : '編輯餐廳'}
      </a>
      <span style={{color: '#bbb'}}>|</span>
      <a href={repoLink} className="footer-link" target="_blank" rel="noreferrer">GitHub Repo</a>
    </footer>
  );
}
