import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import AppFooter from '../components/AppFooter';
import SplashScreen from '../components/SplashScreen';
import { BackgroundPaths } from '@/components/ui/background-paths';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  // Always play splash screen on fresh load for now
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = () => {
    setSplashDone(true);
  };

  return (
    <div className="landing-root">
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          opacity: splashDone ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: splashDone ? 'auto' : 'none',
        }}
      >
      <SharedNavbar variant="landing" />

      {/* Hero Section with BackgroundPaths */}
      <BackgroundPaths title="">
        <section className="lp-hero">
          <div className="hero-tag">
            <span className="dot"></span> AI-POWERED • SDG-ALIGNED • BUILT FOR INDIA
          </div>
          <h1 className="hero-h1">
            Your money,<br />
            <span className="italic-serif">intelligently</span><br />
            understood.
          </h1>
          <p className="hero-p">
            AI-driven financial intelligence that tracks every rupee, forecasts your<br />
            future, and aligns your wealth with the world's most important goals.
          </p>
          <div className="hero-btns">
            <button className="btn-white-large" onClick={() => navigate('/register')}>Start for free</button>
            <button className="btn-outline-large" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>See how it works</button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-val">₹2.4Cr</span>
              <span className="stat-lbl">WEALTH TRACKED</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">17</span>
              <span className="stat-lbl">SDG GOALS MAPPED</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">94%</span>
              <span className="stat-lbl">FORECAST ACCURACY</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">50k+</span>
              <span className="stat-lbl">USERS GLOBALLY</span>
            </div>
          </div>
        </section>
      </BackgroundPaths>

      {/* Hero → Features gradient blend */}
      <div className="section-blend"></div>

      {/* Features Section */}
      <section id="features" className="lp-features">
        <div className="features-header">
          <div className="header-left">
            <span className="sub-tag">CORE PLATFORM</span>
            <h2 className="serif-h2">Nine features.<br /><span className="italic-serif">One seamless</span><br />intelligence layer.</h2>
          </div>
          <div className="header-right">
            <p>Every module — from expense tracking to stock market analysis — shares the same AI spine and SDG impact layer. Your financial life, finally coherent.</p>
          </div>
        </div>

        <div className="features-grid">
          <FeatureCard 
            num="01" 
            title="Smart Expense Tracker" 
            desc="Auto-categorize with AI. Flag hidden drains. Spending impact per transaction." 
            tags={['SDG 2, 12']}
          />
          <FeatureCard 
            num="02" 
            title="Intelligent Budget Planner" 
            desc="Seasonal-adaptive budgets. Festival mode. Dual financial + SDG insights." 
            tags={['SDG 8, 12']}
          />
          <FeatureCard 
            num="03" 
            title="Life Goal Planner" 
            desc="AI success probability. Inflation-aware. Goal Health + SDG Alignment scores." 
            tags={['SDG 4, 17']}
          />
          <FeatureCard 
            num="04" 
            title="Investment Intelligence" 
            desc="Risk quiz → ESG allocation. SDG-aligned fund recommendations. Planet rationale." 
            tags={['SDG 7, 13']}
          />
          <FeatureCard 
            num="05" 
            title="Predictive Forecasting" 
            desc="Monte-Carlo 1/3/5/10 yr projections. SDG trajectory. Optimised vs current path." 
            tags={['All 17 SDGs']}
          />
          <FeatureCard 
            num="06-09" 
            title="Coach • Ledger • Net Worth • Markets" 
            desc="AI coach chatbot • conversational daily logging • net worth hub • live Nifty 50." 
            tags={['SDG-aware']}
          />
        </div>
      </section>

      {/* SDG Layer */}
      <section id="sdg" className="lp-sdg">
        <div className="sdg-header">
          <span className="sub-tag">SDG IMPACT LAYER — ACTIVE ACROSS ALL 9 FEATURES</span>
        </div>
        <div className="sdg-pills">
           {['SDG 1 No Poverty', 'SDG 2 Zero Hunger', 'SDG 3 Good Health', 'SDG 4 Education', 'SDG 5 Gender Equality', 'SDG 7 Clean Energy', 'SDG 8 Decent Work', 'SDG 9 Innovation', 'SDG 11 Sustainable Cities', 'SDG 12 Responsible Consumption', 'SDG 13 Climate Action', 'SDG 17 Partnerships'].map(s => (
             <span key={s} className="sdg-pill">{s}</span>
           ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta">
        <div className="cta-content">
          <span className="sub-tag">ACCESS</span>
          <h2 className="serif-h2">One account.<br /><span className="italic-serif">Total clarity.</span></h2>
          <p className="cta-p">Join 50,000+ users building sustainable wealth. Access all features with a single secure account.</p>
          <button className="btn-white-large" onClick={() => navigate('/register')}>Get Started Now</button>
        </div>
      </section>

      {/* Footer */}
      <AppFooter variant="landing" />
      </div>
    </div>
  );
}

function FeatureCard({ num, title, desc, tags }) {
  return (
    <div className="f-card">
      <span className="f-num">{num}</span>
      <div className="f-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="f-tags">
        {tags.map(t => <span key={t} className="f-tag">• {t}</span>)}
      </div>
    </div>
  );
}
