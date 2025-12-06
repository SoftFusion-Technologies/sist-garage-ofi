import { useState, useEffect } from 'react';
import logoGarage from '../../Images/staff/imgLogo.png';
import menu from '../../Images/staff/menu.png';
import close from '../../Images/staff/close.png';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const NavbarStaff = () => {
  const [active, setActive] = useState('');
  const [toggle, setToggle] = useState(false);
  const { logout, userName, nomyape } = useAuth(); // agrego nomyape
  const navigate = useNavigate();

  const { userLevel } = useAuth();

  const [displayUserName, setDisplayUserName] = useState('');

  useEffect(() => {
    // Priorizar nomyape si existe (es para soyalumno)
    if (nomyape) {
      const primerNombre = nomyape.trim().split(' ')[0];
      setDisplayUserName(primerNombre);
      return;
    }

    // Si no hay nomyape, usamos userName (login normal)
    if (!userName) {
      setDisplayUserName('');
      return;
    }

    if (userName.includes('@')) {
      const atIndex = userName.indexOf('@');
      setDisplayUserName(userName.substring(0, atIndex));
      return;
    }

    const primerNombreUser = userName.trim().split(' ')[0];
    setDisplayUserName(primerNombreUser);
  }, [userName, nomyape]);

  const handleLogout = () => {
    logout();
    navigate('/inicio');
  };

  const Links = [
    {
      id: 1,
      href: 'dashboard',
      title: 'Dashboard',
      roles: ['admin', 'empleado'] // Benjamin Orellana INI / 12/06/2024 /nueva forma de gestionar los accesos
    },
    {
      id: 2,
      href: 'dashboard/usuarios',
      title: 'Usuarios',
      roles: ['admin', 'administrador']
    },
    {
      id: 3,
      href: 'dashboard/locales',
      title: 'Locales',
      roles: ['admin', 'administrador']
    }
  ];

  const filteredLinks = Links.filter((link) => link.roles.includes(userLevel));

  return (
    <>
      {/* Navbar section */}
      <nav className="sticky top-0 z-40">
        <div className="relative overflow-hidden border-b border-white/10 bg-[#060813]/80 backdrop-blur-2xl shadow-[0_15px_40px_-18px_rgba(0,0,0,0.7)]">
          {/* ambient glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-0 h-40 w-40 bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute right-0 top-0 h-32 w-56 bg-cyan-400/20 blur-[110px]" />
            <div className="absolute left-1/2 bottom-[-60px] h-36 w-72 -translate-x-1/2 bg-indigo-500/15 blur-3xl" />
          </div>

          {/* neon line */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 opacity-70" />

          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            {/* Logo + marca */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 p-[1px] shadow-lg shadow-pink-500/30 transition-transform duration-300 group-hover:scale-105">
                <div className="h-full w-full rounded-[14px] bg-black/60 flex items-center justify-center">
                  <img
                    src={logoGarage}
                    alt="Logo"
                    className="h-7 object-contain"
                  />
                </div>
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-white">
                <span className="text-[11px] tracking-[0.32em] text-white/60 uppercase">
                  Garage
                </span>

                <span className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SOFT STAFF
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              </div>
            </Link>

            {/* Links escritorio */}
            <ul className="hidden lg:flex items-center gap-2">
              {filteredLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    to={`/${link.href}`}
                    onClick={() => setActive(link.title)}
                    className={`group relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border backdrop-blur overflow-hidden ${
                      active === link.title
                        ? 'text-white bg-white/15 border-white/30 shadow-[0_10px_35px_-18px_rgba(255,0,128,0.7)]'
                        : 'text-white/75 bg-white/5 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span>{link.title}</span>
                    <span
                      className={`absolute -bottom-[9px] left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all ${
                        active === link.title
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-50'
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Usuario + Logout */}
            <div className="hidden lg:flex items-center gap-3">
              {/* <NotificationBell /> */}
              <span className="text-sm text-white/85 bg-white/10 border border-white/15 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Hola,{' '}
                <strong className="text-white">
                  {displayUserName || 'Invitado'}
                </strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 shadow-lg shadow-pink-500/30 hover:translate-y-[-1px] active:translate-y-0 transition-transform duration-200"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Mobile toggle */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <img
                  src={toggle ? close : menu}
                  alt="hamburger"
                  className="w-6 h-6 object-contain cursor-pointer"
                  onClick={() => setToggle(!toggle)}
                />
              </div>
            </div>
          </div>

          {/* Menú móvil */}
          <div
            className={`lg:hidden transition-all duration-250 ${
              !toggle
                ? 'max-h-0 opacity-0 pointer-events-none'
                : 'max-h-[480px] opacity-100'
            } overflow-hidden`}
          >
            <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/80">
                  Hola,{' '}
                  <strong className="text-white">
                    {displayUserName || 'Invitado'}
                  </strong>
                </span>
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <ul className="flex flex-col gap-2">
                {filteredLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      className={`group relative block w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all overflow-hidden ${
                        active === link.title
                          ? 'bg-white/15 border-white/30 text-white shadow-[0_10px_35px_-18px_rgba(255,0,128,0.7)]'
                          : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      to={`/${link.href}`}
                      onClick={() => {
                        setActive(link.title);
                        setToggle(false);
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <hr className="my-3 border-white/10" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 shadow-lg shadow-pink-500/30 hover:translate-y-[-1px] transition-transform duration-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavbarStaff;
