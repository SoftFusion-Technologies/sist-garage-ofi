import React from 'react';
import { Link } from 'react-router-dom';
import NavbarStaff from './NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
// import Footer from '../../components/footer/Footer';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';

const AdminPage = () => {
  const { userLevel } = useAuth();
  const quickLinks = [
    {
      title: 'Stock',
      href: '/dashboard/stock',
      description: 'Inventario en vivo y alertas rápidas.',
      accent: 'from-cyan-400 via-sky-500 to-blue-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white">
          <path
            fill="currentColor"
            d="M4 6a2 2 0 0 1 2-2h3.5a2 2 0 0 1 1.6.8l1.4 1.9H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
            opacity="0.35"
          />
          <path
            fill="currentColor"
            d="M8 14h8v2H8zm0-4h8v2H8z"
          />
        </svg>
      )
    },
    {
      title: 'Ventas',
      href: '/dashboard/ventas',
      description: 'Pulso comercial y tendencias al instante.',
      accent: 'from-pink-500 via-fuchsia-500 to-rose-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white">
          <path
            fill="currentColor"
            d="M4 5h16v14H4z"
            opacity="0.2"
          />
          <path
            fill="currentColor"
            d="M7 14.5 11 10l3 3 4-5v2l-4 5-3-3-4 4z"
          />
          <circle cx="7" cy="7" r="1.3" fill="currentColor" />
        </svg>
      )
    },
    {
      title: 'Recaptación',
      href: '/dashboard/recaptacion',
      description: 'Proyecciones claras y cashflow listo.',
      accent: 'from-emerald-400 via-teal-400 to-green-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white">
          <path
            fill="currentColor"
            d="M6 6h12v12H6z"
            opacity="0.2"
          />
          <path
            fill="currentColor"
            d="M11 7h2v10h-2z"
          />
          <path
            fill="currentColor"
            d="M15 10h2v7h-2zM7 12h2v5H7z"
            opacity="0.7"
          />
          <circle cx="12" cy="9" r="1.2" fill="currentColor" />
        </svg>
      )
    },
    {
      title: 'Vendedores',
      href: '/dashboard/vendedores',
      description: 'Desempeño del equipo y focos de mejora.',
      accent: 'from-amber-400 via-orange-500 to-red-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white">
          <path
            fill="currentColor"
            d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z"
          />
          <path
            fill="currentColor"
            d="M5 19c.5-3 3.3-5 7-5s6.5 2 7 5v1H5z"
            opacity="0.5"
          />
          <path
            fill="currentColor"
            d="M6 10.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5Z"
            opacity="0.8"
          />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Navbar section */}
      <NavbarStaff />
      {/* Hero section*/}
      <section className="relative w-full min-h-screen bg-[#050712] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -left-24 -top-16 w-80 h-80 bg-pink-500/25 blur-[120px]" />
          <div className="absolute right-0 top-10 w-72 h-72 bg-indigo-500/25 blur-[120px]" />
          <div className="absolute -bottom-10 left-10 w-64 h-64 bg-emerald-400/20 blur-[110px]" />
        </div>

        <ParticlesBackground />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 md:pt-32">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 mb-12">
            <div className="space-y-5 md:max-w-2xl">
              <div className="inline-flex items-center gap-3 bg-white/10 border border-white/10 backdrop-blur px-4 py-2 rounded-full text-xs uppercase tracking-[0.24em] text-white/80">
                <span className="flex items-center gap-2">
                  PANEL EJECUTIVO
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                {userLevel && (
                  <span className="px-2 py-1 rounded-full bg-black/30 text-[10px] font-semibold">
                    ROL: {userLevel}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <h1 className="titulo uppercase text-3xl sm:text-4xl lg:text-3xl font-bold text-white leading-tight">
                  Decisiones rápidas, ejecución elegante.
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/60">Visión</p>
                <p className="text-lg font-semibold text-white">4 accesos premium</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/60">Modo</p>
                <p className="text-lg font-semibold text-white">Operando 24/7</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
            {quickLinks.map((item, index) => (
              <Link to={item.href} key={item.title}>
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.12 * index }}
                  whileHover={{ y: -10, rotate: -0.2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 lg:p-7 shadow-xl shadow-black/20 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r opacity-10 pointer-events-none" />
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg shadow-black/30`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                      <p className="text-sm text-white/80 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                  <div className="mt-5 h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white/60" />
                    Acceso directo • Experiencia premium
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPage;
