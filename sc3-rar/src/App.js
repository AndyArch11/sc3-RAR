import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import WrappedRARForm from './components/RARForm';

{/* Breadcrumbs 
function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  return (
    <nav style={{ margin: '10px 0' }}>
      <Link to="/">Home</Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        return (
          <span key={to}>
            {' / '}
            <Link to={to}>{value}</Link>
          </span>
        );
      })}
    </nav>
  );
}
*/}

function App() {
  return (
    <Router>
      {/* <Breadcrumbs /> */}
      <Routes>
        <Route path="/" element={<WrappedRARForm />} />
      </Routes>
    </Router>
  );
}

export default App;
