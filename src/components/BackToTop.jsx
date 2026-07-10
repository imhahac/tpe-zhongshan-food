import React from 'react';
import './BackToTop.css';

export default function BackToTop({ show, lang, scrollToTop }) {
  if (!show) return null;

  return (
    <button className="back-to-top" onClick={scrollToTop} title={lang === 'en' ? 'Back to top' : '回到頂部'}>
      &#9650;
    </button>
  );
}
