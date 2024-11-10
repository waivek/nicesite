import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Nav from '../components/Nav';

const routes = [
  {
    path: '/reactions',
    name: 'Reactions',
    description: 'Manage and track your recurring reactions'
  },
  {
    path: '/dailies',
    name: 'Dailies',
    description: 'Daily CRK Tasks'
  }
  // Add more routes here as needed
];

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Home</title>
      </Helmet>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <Nav />
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4">
          <div className="py-4">
            <h1 className="text-4xl font-semibold tracking-wide mb-8">ROUTES</h1>
            <div className="flex flex-col gap-4">
              {routes.map((route, index) => (
                <div key={index} className="flex items-baseline gap-3">
                  <Link 
                    to={route.path}
                    className="text-xl font-semibold text-cyan-400 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {route.name}
                  </Link>
                  <div className="text-sm text-slate-500">
                    {route.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
