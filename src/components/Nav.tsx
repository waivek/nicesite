import { Link, useLocation } from 'react-router-dom';

const Nav = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isReactions = location.pathname === '/reactions';
  const isDailies = location.pathname === '/dailies';

  return (
    <nav className="border-b border-slate-700">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-1">
          <Link 
            to="/"
            className={`px-4 py-3 hover:bg-slate-800 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] ${
              isHome 
                ? 'after:w-full after:bg-cyan-400' 
                : 'after:w-0 after:bg-cyan-400 hover:after:w-full'
            } after:transition-all after:duration-300`}
          >
            Home
          </Link>
          <Link 
            to="/reactions"
            className={`px-4 py-3 hover:bg-slate-800 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] ${
              isReactions 
                ? 'after:w-full after:bg-cyan-400' 
                : 'after:w-0 after:bg-cyan-400 hover:after:w-full'
            } after:transition-all after:duration-300`}
          >
            Reactions
          </Link>
          <Link 
            to="/dailies"
            className={`px-4 py-3 hover:bg-slate-800 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] ${
              isDailies 
                ? 'after:w-full after:bg-cyan-400' 
                : 'after:w-0 after:bg-cyan-400 hover:after:w-full'
            } after:transition-all after:duration-300`}
          >
            Dailies
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
