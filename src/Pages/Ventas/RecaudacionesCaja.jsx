import React, { useEffect, useMemo, useState } from 'react';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { useAuth } from '../../AuthContext';
import {
  FaMoneyBillWave,
  FaSearch,
  FaStore,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import { fetchLocales, fetchUsuarios } from '../../utils/utils.js';

const BASE_URL = 'http://localhost:8080';

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(Number(n) || 0);

export default function RecaudacionesCaja() {
  const { userLevel, userLocalId } = useAuth();

  const [recaudaciones, setRecaudaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [locales, setLocales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Filtros
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [fLocal, setFLocal] = useState('auto'); // 'auto' = local del usuario por defecto
  const [fUsuario, setFUsuario] = useState('todos');
  const [q, setQ] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 20;

  const nombreLocal = (id) =>
    locales.find((l) => l.id === id)?.nombre || `Local #${id}`;
  const nombreUsuario = (id) =>
    usuarios.find((u) => u.id === id)?.nombre || `Usuario #${id}`;

  const cargarRecaudaciones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      const localIdFinal =
        userLevel === 'admin' ? (fLocal === 'auto' ? '' : fLocal) : userLocalId;

      if (localIdFinal) params.append('local_id', localIdFinal);
      if (fUsuario !== 'todos') params.append('usuario_id', fUsuario);
      if (fDesde) params.append('desde', fDesde);
      if (fHasta) params.append('hasta', fHasta);

      const url = params.toString()
        ? `${BASE_URL}/caja/recaudaciones?${params.toString()}`
        : `${BASE_URL}/caja/recaudaciones`;

      const res = await fetch(url);
      const data = await res.json();

      // 👇 soporta ambos formatos: array puro o objeto con data[]
      const filas = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      setRecaudaciones(filas);
      setPaginaActual(1);

      // opcional: para debug
      // console.log('Recaudaciones cargadas:', filas);
    } catch (e) {
      console.error(e);
      setRecaudaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carga catálogos y luego trae recaudaciones
    Promise.all([fetchLocales(), fetchUsuarios()])
      .then(([locs, users]) => {
        setLocales(locs || []);
        setUsuarios(users || []);
      })
      .finally(() => {
        cargarRecaudaciones();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro en front por texto
  const recaudacionesFiltradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    let arr = [...recaudaciones];

    if (texto) {
      arr = arr.filter((r) => {
        const obs = (r.observaciones || '').toLowerCase();
        return (
          obs.includes(texto) ||
          String(r.caja_id).includes(texto) ||
          String(r.monto).includes(texto)
        );
      });
    }

    return arr;
  }, [recaudaciones, q]);

  const totalPaginas = Math.ceil(
    recaudacionesFiltradas.length / itemsPorPagina
  );

  const recaudacionesPaginadas = recaudacionesFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const totalPeriodo = useMemo(
    () =>
      recaudacionesFiltradas.reduce((acc, r) => acc + Number(r.monto || 0), 0),
    [recaudacionesFiltradas]
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#101016] via-[#181A23] to-[#11192b] px-2 py-8">
      <ParticlesBackground />
      <ButtonBack />

      <div className="w-full max-w-5xl bg-[#212432] rounded-2xl shadow-2xl p-5 relative border border-white/5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="uppercase titulo text-2xl md:text-3xl font-bold text-emerald-400 flex items-center gap-3">
              <FaMoneyBillWave className="text-3xl" />
              Recaudaciones de Caja
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Consulta de retiros/recaudaciones por local, usuario y fecha.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400">
              Total recaudado en el período:
            </span>
            <span className="text-xl font-black text-emerald-300">
              {fmtARS(totalPeriodo)}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          {/* Fecha desde */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
              <FaCalendarAlt className="text-emerald-300" /> Desde
            </label>
            <input
              type="date"
              value={fDesde}
              onChange={(e) => setFDesde(e.target.value)}
              className="bg-[#23253a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
              <FaCalendarAlt className="text-emerald-300" /> Hasta
            </label>
            <input
              type="date"
              value={fHasta}
              onChange={(e) => setFHasta(e.target.value)}
              className="bg-[#23253a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>

          {/* Local (solo admin) */}
          {userLevel === 'admin' ? (
            <div className="flex flex-col">
              <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
                <FaStore className="text-emerald-300" /> Local
              </label>
              <select
                value={fLocal}
                onChange={(e) => setFLocal(e.target.value)}
                className="bg-[#23253a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                <option value="auto">Todos los locales</option>
                {locales.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col">
              <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
                <FaStore className="text-emerald-300" /> Local
              </label>
              <div className="bg-[#23253a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200">
                {nombreLocal(userLocalId)}
              </div>
            </div>
          )}

          {/* Usuario (solo admin, opcional) */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
              <FaUser className="text-emerald-300" /> Usuario
            </label>
            <select
              value={fUsuario}
              onChange={(e) => setFUsuario(e.target.value)}
              className="bg-[#23253a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              <option value="todos">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1 text-xs text-gray-300 mb-1">
              <FaSearch className="text-emerald-300" /> Buscar
            </label>
            <div className="flex items-center gap-2 bg-[#23253a] border border-white/10 rounded-lg px-3 py-2">
              <FaSearch className="text-gray-400 text-sm" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Caja, monto u obs.."
                className="bg-transparent text-sm text-white flex-1 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={cargarRecaudaciones}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg"
          >
            Aplicar filtros
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            Cargando recaudaciones...
          </div>
        ) : recaudacionesFiltradas.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            No se encontraron recaudaciones.
          </div>
        ) : (
          <div className="overflow-auto max-h-[520px] rounded-2xl border border-[#262940] bg-[#1c1f2c]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-emerald-300 border-b border-[#262940]">
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Local</th>
                  <th className="px-4 py-2 text-left">Usuario</th>
                  <th className="px-4 py-2 text-left">Caja</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-left">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {recaudacionesPaginadas.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#262940] hover:bg-emerald-900/10 transition"
                  >
                    <td className="px-4 py-2 text-gray-200">
                      {format(
                        new Date(r.fecha_recaudacion),
                        'dd/MM/yyyy HH:mm'
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      {nombreLocal(r.local_id)}
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      {nombreUsuario(r.usuario_id)}
                    </td>
                    <td className="px-4 py-2 text-gray-300 font-mono">
                      #{r.caja_id}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-300 text-base">
                      {fmtARS(r.monto)}
                    </td>
                    <td className="px-4 py-2 text-gray-300 text-xs">
                      {r.observaciones || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2 text-white text-sm">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
