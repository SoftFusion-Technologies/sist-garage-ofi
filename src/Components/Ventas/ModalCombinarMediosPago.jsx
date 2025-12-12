import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FaTimes,
  FaPlus,
  FaSave,
  FaSearch,
  FaTrash,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const BASE_URL = 'http://localhost:8080';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true
});

const isActivo = (v) => Number(v) === 1 || v === true;

export default function ModalCombinarMediosPago({
  show,
  onClose,
  mediosPago,
  refreshMedios
}) {
  const compuestos = useMemo(() => {
    return (mediosPago || [])
      .filter((m) => isActivo(m.activo))
      .filter((m) => String(m.tipo || '').toUpperCase() === 'COMPUESTO')
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [mediosPago]);

  const simples = useMemo(() => {
    return (mediosPago || [])
      .filter((m) => isActivo(m.activo))
      .filter((m) => String(m.tipo || 'SIMPLE').toUpperCase() === 'SIMPLE')
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [mediosPago]);

  const [modo, setModo] = useState('NUEVO'); // NUEVO | EDITAR
  const [selectedCompuesto, setSelectedCompuesto] = useState(null);

  const [qComp, setQComp] = useState('');
  const [qSimple, setQSimple] = useState('');

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0,
    componentesIds: [] // ordenados
  });

  const resetForm = () => {
    setModo('NUEVO');
    setSelectedCompuesto(null);
    setQComp('');
    setQSimple('');
    setForm({
      nombre: '',
      descripcion: '',
      icono: '',
      orden: 0,
      componentesIds: []
    });
  };

  useEffect(() => {
    if (!show) resetForm();
  }, [show]);

  const compuestosFiltrados = useMemo(() => {
    const q = qComp.trim().toLowerCase();
    if (!q) return compuestos;
    return compuestos.filter((m) =>
      `${m.nombre} ${m.descripcion || ''}`.toLowerCase().includes(q)
    );
  }, [compuestos, qComp]);

  const simplesFiltrados = useMemo(() => {
    const q = qSimple.trim().toLowerCase();
    if (!q) return simples;
    return simples.filter((m) =>
      `${m.nombre} ${m.descripcion || ''}`.toLowerCase().includes(q)
    );
  }, [simples, qSimple]);

  const selectedSimples = useMemo(() => {
    const map = new Map(simples.map((s) => [s.id, s]));
    return form.componentesIds.map((id) => map.get(id)).filter(Boolean);
  }, [form.componentesIds, simples]);

  const cargarCompuesto = async (m) => {
    setModo('EDITAR');
    setSelectedCompuesto(m);

    try {
      const res = await axios.get(
        `${BASE_URL}/medios-pago/${m.id}/componentes`
      );
      const rows = Array.isArray(res.data) ? res.data : [];

      // respetar el orden si viene
      rows.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

      const ids = rows
        .map((x) => x?.medio?.id || x?.medio_pago_id)
        .filter(Boolean);

      setForm({
        nombre: m.nombre || '',
        descripcion: m.descripcion || '',
        icono: m.icono || '',
        orden: m.orden || 0,
        componentesIds: ids
      });
    } catch (e) {
      Swal.fire('Error', e?.response?.data?.mensajeError || e.message, 'error');
    }
  };

  const toggleComponente = (id) => {
    setForm((prev) => {
      const existe = prev.componentesIds.includes(id);
      const next = existe
        ? prev.componentesIds.filter((x) => x !== id)
        : [...prev.componentesIds, id];
      return { ...prev, componentesIds: next };
    });
  };

  const removeSelected = (id) => {
    setForm((prev) => ({
      ...prev,
      componentesIds: prev.componentesIds.filter((x) => x !== id)
    }));
  };

  const moveSelected = (id, dir) => {
    setForm((prev) => {
      const arr = [...prev.componentesIds];
      const i = arr.indexOf(id);
      if (i === -1) return prev;

      const j = dir === 'UP' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return prev;

      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, componentesIds: arr };
    });
  };

  const validar = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.';
    if (!form.componentesIds || form.componentesIds.length < 2)
      return 'Seleccioná al menos 2 componentes.';
    return null;
  };

  const doRefresh = async () => {
    if (typeof refreshMedios === 'function') await refreshMedios();
  };

  const guardar = async () => {
    const err = validar();
    if (err) return Swal.fire('Validación', err, 'warning');

    setSaving(true);
    try {
      let compuestoId = selectedCompuesto?.id;

      if (modo === 'NUEVO') {
        const r = await axios.post(`${BASE_URL}/medios-pago`, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion || '',
          icono: form.icono || '',
          orden: Number(form.orden || 0),
          ajuste_porcentual: 0,
          tipo: 'COMPUESTO'
        });
        compuestoId = r?.data?.medio?.id;
      } else {
        await axios.put(`${BASE_URL}/medios-pago/${compuestoId}`, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion || '',
          icono: form.icono || '',
          orden: Number(form.orden || 0),
          tipo: 'COMPUESTO'
        });
      }

      if (!compuestoId)
        throw new Error('No se pudo determinar el ID del medio compuesto.');

      await axios.put(`${BASE_URL}/medios-pago/${compuestoId}/componentes`, {
        componentes: form.componentesIds.map((id, idx) => ({
          medio_pago_id: id,
          orden: idx + 1,
          activo: 1
        }))
      });

      await doRefresh();

      Toast.fire({ icon: 'success', title: 'Medio compuesto guardado' });
      resetForm();
    } catch (e) {
      Swal.fire('Error', e?.response?.data?.mensajeError || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xl px-3">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden">
        <div className="relative h-full flex flex-col bg-zinc-950/90 rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.75)] border border-zinc-800/80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-cyan-500/10 via-zinc-900/80 to-emerald-500/10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70 mb-1">
                Configuración · Ventas
              </p>
              <h2 className="titulo uppercase text-xl sm:text-2xl font-semibold text-zinc-50 tracking-tight">
                Combinar medios de pago
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Se crean medios <b>COMPUESTOS</b> a partir de medios{' '}
                <b>SIMPLE</b>.
              </p>
            </div>

            <button
              className="h-10 w-10 flex items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:border-red-500/80 hover:scale-105 transition-all"
              onClick={onClose}
              title="Cerrar"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: compuestos */}
            <div className="lg:w-[38%] border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950/95 flex flex-col">
              <div className="px-5 sm:px-7 py-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Medios compuestos
                  </div>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/30 transition-all"
                    title="Nuevo"
                  >
                    <FaPlus />
                    Nuevo
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/70 px-3 py-2">
                  <FaSearch className="text-zinc-500 text-sm" />
                  <input
                    value={qComp}
                    onChange={(e) => setQComp(e.target.value)}
                    placeholder="Buscar compuesto..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                  <span className="text-[11px] text-zinc-500">
                    {compuestosFiltrados.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
                {compuestosFiltrados.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center mt-8">
                    No hay medios compuestos aún.
                  </div>
                ) : (
                  compuestosFiltrados.map((m) => {
                    const selected = selectedCompuesto?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => cargarCompuesto(m)}
                        className={`w-full text-left mb-2 rounded-2xl px-4 py-3 border transition-all ${
                          selected
                            ? 'border-emerald-500/70 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-emerald-500/40 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-extrabold text-zinc-100 truncate">
                            {m.nombre}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
                            COMPUESTO
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                          {m.descripcion || '—'}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: editor */}
            <div className="flex-1 bg-zinc-950/95 flex flex-col overflow-hidden">
              <div className="px-5 sm:px-7 py-4 border-b border-zinc-800/80 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
                    {modo === 'NUEVO' ? 'Creación' : 'Edición'}
                  </p>
                  <h3 className="text-lg font-semibold text-zinc-50 truncate">
                    {modo === 'NUEVO'
                      ? 'Nuevo medio compuesto'
                      : selectedCompuesto?.nombre || 'Editar compuesto'}
                  </h3>
                </div>

                <button
                  onClick={guardar}
                  disabled={saving}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-extrabold text-zinc-950 shadow-lg transition-all ${
                    saving
                      ? 'opacity-60 cursor-wait bg-emerald-400'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 active:scale-95'
                  }`}
                >
                  <FaSave />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-7 py-5">
                {/* Form cabecera */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nombre: e.target.value }))
                    }
                    className="w-full rounded-2xl px-4 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                    placeholder="Nombre (ej: EFECTIVO + TRANSFERENCIA)"
                  />
                  <input
                    value={form.icono}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, icono: e.target.value }))
                    }
                    className="w-full rounded-2xl px-4 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    placeholder="Icono (ej: FaLayerGroup)"
                  />
                  <input
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, descripcion: e.target.value }))
                    }
                    className="md:col-span-2 w-full rounded-2xl px-4 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    placeholder="Descripción (opcional)"
                  />
                </div>

                {/* Seleccionados */}
                <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-zinc-100">
                      Seleccionados ({form.componentesIds.length})
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      El orden se guarda
                    </div>
                  </div>

                  {selectedSimples.length === 0 ? (
                    <div className="text-zinc-500 text-sm mt-3">
                      Seleccioná 2 o más medios SIMPLE.
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {selectedSimples.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-100 truncate">
                              {m.nombre}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {m.descripcion || '—'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveSelected(m.id, 'UP')}
                              className="p-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/60 transition"
                              title="Subir"
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSelected(m.id, 'DOWN')}
                              className="p-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/60 transition"
                              title="Bajar"
                            >
                              <FaArrowDown />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSelected(m.id)}
                              className="p-2 rounded-xl border border-zinc-700 bg-zinc-900 text-red-300 hover:border-red-500/60 transition"
                              title="Quitar"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Componentes disponibles */}
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-sm font-extrabold text-zinc-100">
                      Componentes (SIMPLE)
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/70 px-3 py-2 w-full max-w-md">
                      <FaSearch className="text-zinc-500 text-sm" />
                      <input
                        value={qSimple}
                        onChange={(e) => setQSimple(e.target.value)}
                        placeholder="Buscar simple..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                      />
                      <span className="text-[11px] text-zinc-500">
                        {simplesFiltrados.length}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {simplesFiltrados.map((m) => {
                      const checked = form.componentesIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleComponente(m.id)}
                          className={`px-4 py-3 rounded-2xl border text-left transition-all ${
                            checked
                              ? 'border-cyan-500/60 bg-cyan-500/10'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-emerald-500/40 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-zinc-100 truncate">
                              {m.nombre}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-800/50">
                              SIMPLE
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-1">
                            {m.descripcion || '—'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 text-xs text-zinc-500">
                    Tip: el compuesto se usa como “alias” para cobrar con 2 o
                    más medios.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-8 py-4 border-t border-zinc-800/80 flex justify-end bg-zinc-950/95">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-200 font-extrabold hover:bg-zinc-800 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
