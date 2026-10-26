import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      <header className="navbar bg-base-100 shadow-md">
        <div className="flex-1">
          <Link to="/tasks" className="btn btn-ghost text-xl normal-case">
            <span aria-hidden="true">✓</span> TaskFlow
          </Link>
        </div>
        <nav className="flex-none">
          <ul className="menu menu-horizontal gap-1 px-1">
            <li>
              <Link to="/tasks">Mes tâches</Link>
            </li>
          </ul>
        </nav>
        <div className="flex-none gap-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-circle avatar placeholder"
                aria-label="Menu utilisateur"
              >
                <div className="w-10 rounded-full bg-primary text-primary-content">
                  <span>{getInitials(user.name, user.email)}</span>
                </div>
              </button>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content z-[1] mt-3 w-56 rounded-box bg-base-100 p-2 shadow"
              >
                <li className="menu-title truncate">
                  {user.name || user.email}
                </li>
                <li>
                  <button type="button" onClick={() => void signOut()}>
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Connexion
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
