import { useState, useRef } from 'react';
import './SplashScreen.css';

const VIDEO_URL = 'https://res.cloudinary.com/dugqak5i3/video/upload/v1775201368/Finsight_Black_wezpd6.mp4';

export default function SplashScreen({ onComplete }) {
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  const finish = () => {
    if (fading) return;
    setFading(true);
    setTimeout(onComplete, 900); // match CSS transition duration
  };

  return (
    <div className={`splash-root ${fading ? 'splash-out' : ''}`}>
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        className="splash-video"
      />

      {/* Subtle skip button */}
      <button className="splash-skip" onClick={finish}>
        Skip <span className="splash-skip-arrow">→</span>
      </button>

      {/* Bottom vignette for smooth visual blend */}
      <div className="splash-vignette" />
    </div>
  );
}
