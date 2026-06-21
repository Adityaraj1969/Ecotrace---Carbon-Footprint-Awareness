import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// ACCESSIBILITY: Skip-to-content link
// Keyboard users (and screen reader users navigating by Tab) hit this first.
// It's visually hidden until focused, then jumps them past the sidebar to
// the main content — standard WCAG 2.4.1 requirement.
const skipLinkStyle = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  zIndex: 9999,
  padding: 0,
  border: 0,
  background: '#fff',
  color: '#16a34a',
  fontWeight: 600,
  fontSize: '14px',
  textDecoration: 'none',
  borderRadius: '8px',
};

const skipLinkFocusStyle = {
  left: '16px',
  top: '16px',
  width: 'auto',
  height: 'auto',
  padding: '10px 20px',
  border: '2px solid #16a34a',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Skip link — invisible until Tab is pressed, then jumps to #main-content */}
      <a
        href="#main-content"
        style={skipLinkStyle}
        onFocus={e => Object.assign(e.target.style, skipLinkFocusStyle)}
        onBlur={e => Object.assign(e.target.style, { left: '-9999px', top: 'auto', width: '1px', height: '1px', padding: 0, border: 0 })}
      >
        Skip to main content
      </a>

      <Navbar />

      {/* ACCESSIBILITY: id="main-content" is the skip link target.
          role="main" is implicit on <main> but explicit here for older AT.
          tabIndex="-1" lets the skip link move focus here programmatically. */}
      <main
        id="main-content"
        tabIndex="-1"
        className="flex-1 ml-60 p-8 min-h-screen focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}