import { useEffect, useMemo, useState } from 'react';
import { FaTimes, FaCheck, FaMagic } from 'react-icons/fa';
import Swal from 'sweetalert2';

const toNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function ModalPagoCompuesto({
  open,
  onClose,
  total,
  compuestoNombre,
  componentes, // [{ id, nombre, descripcion, orden }]
  onConfirm
}) {
  const totalNum = useMemo(() => toNum(total), [total]);
  const [montos, setMontos] = useState({}); // { [medioId]: number }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // init montos en 0
    const init = {};
    (componentes || []).forEach((c) => (init[c.id] = 0));
    setMontos(init);
  }, [open, componentes]);

  const suma = useMemo(() => {
    return Object.values(montos).reduce((acc, v) => acc + toNum(v), 0);
  }, [montos]);

  const diff = useMemo(() => +(totalNum - suma).toFixed(2), [totalNum, suma]);
  const ok = Math.abs(diff) <= 0.01; // tolerancia centavos

  const autocompletar = () => {
    const comps = componentes || [];
    if (comps.length === 0) return;
    const lastId = comps[comps.length - 1].id;
    setMontos((prev) => {
      const next = { ...prev };
      const s = Object.entries(next).reduce(
        (acc, [k, v]) => acc + (Number(k) === lastId ? 0 : toNum(v)),
        0
      );
      next[lastId] = +(totalNum - s).toFixed(2);
      return next;
    });
  };

  const confirmar = async () => {
    if (!ok) {
      Swal.fire(
        'Validación',
        'La suma de componentes debe coincidir con el total.',
        'warning'
      );
      return;
    }
    setLoading(true);
    try {
      const detalle = (componentes || []).map((c, idx) => ({
        medio_pago_id: c.id,
        orden: idx,
        monto: +toNum(montos[c.id]).toFixed(2)
      }));
      await onConfirm(detalle);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xl px-3">
      <div className="w-full max-w-xl bg-zinc-950/90 rounded-3xl border border-zinc-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.75)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-emerald-500/10 via-zinc-900/80 to-cyan-500/10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/70">
              Pago compuesto
            </p>
            <h3 className="text-lg font-semibold text-zinc-50">
              {compuestoNombre || 'Medio compuesto'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:border-red-500/80 transition"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Total a cobrar
              </span>
              <span className="text-xl font-extrabold text-zinc-50">
                $
                {totalNum.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            <div className="mt-2 text-xs text-zinc-400">
              Cargá cuánto entra por cada componente. La suma debe dar el total.
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {(componentes || []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-100 truncate">
                    {c.nombre}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {c.descripcion || '—'}
                  </div>
                </div>

                <input
                  type="number"
                  step="0.01"
                  value={montos[c.id] ?? 0}
                  onChange={(e) =>
                    setMontos((prev) => ({
                      ...prev,
                      [c.id]: toNum(e.target.value)
                    }))
                  }
                  className="w-40 text-right rounded-2xl px-3 py-2 text-sm bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={autocompletar}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/60 transition"
              title="Completa el último componente con el resto"
            >
              <FaMagic />
              Autocompletar
            </button>

            <div className="text-right">
              <div className="text-xs text-zinc-500">
                Suma: ${suma.toFixed(2)} · Dif: {diff > 0 ? '+' : ''}
                {diff.toFixed(2)}
              </div>
              <div
                className={`text-xs font-semibold ${
                  ok ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {ok ? 'OK: coincide con el total' : 'No coincide con el total'}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-200 font-semibold hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>

            <button
              disabled={!ok || loading}
              onClick={confirmar}
              className={`px-5 py-2.5 rounded-2xl font-extrabold text-zinc-950 transition ${
                !ok || loading
                  ? 'bg-emerald-500/40 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <FaCheck />
                {loading ? 'Confirmando...' : 'Confirmar y registrar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
