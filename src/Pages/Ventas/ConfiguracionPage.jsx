import { useState, useEffect, useCallback } from 'react';
import ConfiguracionPanel from './Config/ConfiguracionPanel';
import ModalMediosPago from '../../Components/Ventas/ModalMediosPago';
import ModalCombinarMediosPago from '../../Components/Ventas/ModalCombinarMediosPago';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

export default function ConfiguracionPage() {
  const [showModal, setShowModal] = useState(false);
  const [showModalCombinar, setShowModalCombinar] = useState(false);
  const [mediosPago, setMediosPago] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshMedios = useCallback(async () => {
    const res = await axios.get(`${BASE_URL}/medios-pago`);
    setMediosPago(res.data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshMedios();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMedios]);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 py-8">
      <ConfiguracionPanel
        abrirModalMediosPago={() => setShowModal(true)}
        abrirModalCombinarMediosPago={() => setShowModalCombinar(true)}
        loadingMediosPago={loading}
      />

      <ModalMediosPago
        show={showModal}
        onClose={() => setShowModal(false)}
        mediosPago={mediosPago}
        setMediosPago={setMediosPago}
      />

      <ModalCombinarMediosPago
        show={showModalCombinar}
        onClose={() => setShowModalCombinar(false)}
        mediosPago={mediosPago}
        refreshMedios={refreshMedios} // ✅ ahora sí
      />
    </div>
  );
}
