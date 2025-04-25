import React from 'react';
import Converter from './components/Converter';
import VideoConverter from './components/videoConverter';
import './styles.css';

const App = () => {
  React.useEffect(() => {
    document.querySelector('.webm-converter').classList.add('hidden');
    document.querySelector('.webp-converter').classList.remove('hidden');
    document.querySelector('.changeConverter .disabled').classList.add('disabled');
  }, []);

  const changeConverter = (e) => {
    const converterName = e.target.getAttribute('data-cname');
    const converter = document.querySelector(`.${converterName}`);
    document.querySelectorAll('.webp-converter, .webm-converter').forEach(el => {
      el.classList.add('hidden');
    });
    converter.classList.remove('hidden');

    document.querySelectorAll('.changeConverter p').forEach(el => {
      el.classList.remove('disabled');
    });
    e.target.classList.add('disabled');
  }
  return (
    <div className="app">
      <img src="../../Mug.gif" alt="FE MUG" />
      <div className='webp-converter'>
      <Converter />
      </div>
      <div className='webm-converter'>
      <VideoConverter />
      </div>
      <div className='changeConverter'>
          <p className='disabled' data-cname='webp-converter' 
          onClick={changeConverter}  
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0b1b5c')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#014599')}>
            WebP Converter
          </p>
          <p data-cname='webm-converter' onClick={changeConverter} 
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0b1b5c')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#014599')}>
            WebM Converter
          </p>
      </div>
    </div>
  );
};
export default App;
