import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaBox, FaPlus, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import DropdownCategoriasConFiltro from '../../Components/DropdownCategoriasConFiltro.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import AdminActions from '../../Components/AdminActions';

Modal.setAppElement('#root');

const ProductosGet = () => {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio: '',
    descuento_porcentaje: '', // <-- AGREGADO
    imagen_url: '',
    estado: 'activo'
  });
  const [confirmDelete, setConfirmDelete] = useState(null); // objeto con ID a eliminar
  const [warningMessage, setWarningMessage] = useState('');

  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [estadoCategoriaFiltro, setEstadoCategoriaFiltro] = useState('todas');

  const [categorias, setCategorias] = useState([]);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ordenCampo, setOrdenCampo] = useState('nombre');
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25

  const fetchData = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        axios.get('http://localhost:8080/productos'),
        axios.get('http://localhost:8080/categorias')
      ]);
      setProductos(resProd.data);
      setCategorias(resCat.data);
    } catch (error) {
      console.error('Error al cargar productos o categorías:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = productos
    .filter((p) => {
      const searchLower = search.toLowerCase();

      // Campos a buscar (solo strings)
      const campos = [
        p.nombre,
        p.descripcion,
        p.categoria?.nombre // <- extraemos nombre de la categoría
      ];

      return campos.some(
        (campo) =>
          typeof campo === 'string' && campo.toLowerCase().includes(searchLower)
      );
    })
    .filter((p) =>
      estadoFiltro === 'todos' ? true : p.estado === estadoFiltro
    )
    .filter((p) =>
      categoriaFiltro === null
        ? true
        : p.categoria_id === parseInt(categoriaFiltro)
    )
    .filter((p) => {
      const precio = parseFloat(p.precio);
      const min = parseFloat(precioMin) || 0;
      const max = parseFloat(precioMax) || Infinity;
      return precio >= min && precio <= max;
    })
    .sort((a, b) => {
      if (ordenCampo === 'precio') return a.precio - b.precio;
      return a.nombre.localeCompare(b.nombre);
    });

  const openModal = (producto = null) => {
    if (producto) {
      setEditId(producto.id);
      setFormValues({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id || producto.categoria?.id || '',
        precio: producto.precio?.toString() ?? '',
        descuento_porcentaje: producto.descuento_porcentaje ?? '', // <-- AGREGADO
        imagen_url: producto.imagen_url || '',
        estado: producto.estado || 'activo'
      });
    } else {
      setEditId(null);
      setFormValues({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio: '0',
        imagen_url: '',
        estado: 'activo'
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedPrecio = parseFloat(formValues.precio);
    if (isNaN(parsedPrecio) || parsedPrecio < 0) {
      alert('Por favor ingrese un precio válido');
      return;
    }

    try {
      const dataToSend = {
        ...formValues,
        precio: parsedPrecio.toFixed(2) // asegura formato DECIMAL(10,2)
      };

      console.log(formValues);

      if (editId) {
        await axios.put(
          `http://localhost:8080/productos/${editId}`,
          dataToSend
        );
      } else {
        await axios.post('http://localhost:8080/productos', dataToSend);
      }

      fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar producto:', err);
    }
  };
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/productos/${id}`);
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
      } else {
        console.error('Error al eliminar producto:', err);
      }
    }
  };

  const exportarProductosAExcel = (productos) => {
    const data = productos.map((p) => ({
      ID: p.id,
      Nombre: p.nombre,
      Descripción: p.descripcion || '',
      Precio: `$${parseFloat(p.precio).toFixed(2)}`,
      Estado: p.estado === 'inactivo' ? 'Inactivo' : 'Activo',
      Categoría: p.categoria?.nombre || 'Sin categoría',
      SKU: p.codigo_sku || '',
      'Creado el': new Date(p.created_at).toLocaleString('es-AR'),
      'Actualizado el': new Date(p.updated_at).toLocaleString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // 🕒 Nombre de archivo dinámico con fecha
    const fecha = new Date();
    const timestamp = fecha
      .toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-');

    const nombreArchivo = `productos-exportados-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-6 text-white relative">
      <ParticlesBackground />
      <ButtonBack />
      <div className="max-w-6xl mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            {/* Título */}
            <h1 className="text-4xl font-bold titulo text-rose-400 flex items-center gap-3 uppercase drop-shadow">
              <FaBox /> Productos
            </h1>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <BulkUploadButton
                tabla="productos"
                onSuccess={() => fetchData()} // refrescar lista si lo necesitas
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              />

              <button
                onClick={() => exportarProductosAExcel(filtered)}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-white"
              >
                <FaDownload /> Exportar Excel
              </button>

              <button
                onClick={() => openModal()}
                className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 transition px-5 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
              >
                <FaPlus /> Nuevo Producto
              </button>
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          {/* Categoría */}
          <DropdownCategoriasConFiltro
            categorias={categorias}
            selected={categoriaFiltro}
            onChange={setCategoriaFiltro}
          />

          {/* Orden */}
          <select
            value={ordenCampo}
            onChange={(e) => setOrdenCampo(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          >
            <option value="nombre">Ordenar por nombre</option>
            <option value="precio">Ordenar por precio</option>
          </select>

          {/* Precio mínimo */}
          <input
            type="number"
            placeholder="Precio mínimo"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          />

          {/* Precio máximo */}
          <input
            type="number"
            placeholder="Precio máximo"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-1">ID: {p.id}</h2>
              <h2 className="text-xl font-bold text-rose-300 mb-1">
                {p.nombre}
              </h2>
              <p className="text-sm text-gray-200 mb-2">
                Descripción: {p.descripcion || 'Sin Descripción'}
              </p>

              <p className="text-sm text-gray-400">
                Categoría: {p.categoria?.nombre || 'Sin categoría'}
              </p>

              <div className="flex items-center gap-3 mt-2">
                {/* Precio original */}
                <span
                  className={
                    p.descuento_porcentaje > 0
                      ? 'text-gray-400 line-through text-sm'
                      : 'text-green-300 font-semibold'
                  }
                >
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 2
                  }).format(p.precio || 0)}
                </span>
                {/* Precio con descuento, si corresponde */}
                {p.descuento_porcentaje > 0 && (
                  <span className="text-green-400 font-bold text-lg drop-shadow">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                      minimumFractionDigits: 2
                    }).format(p.precio_con_descuento)}
                  </span>
                )}
                {/* Etiqueta de descuento */}
                {p.descuento_porcentaje > 0 && (
                  <span className="bg-rose-100 text-rose-500 rounded px-2 py-1 text-xs font-bold ml-1">
                    -{p.descuento_porcentaje}% OFF
                  </span>
                )}
              </div>

              <p
                className={`mt-2 uppercase text-sm font-semibold mb-1 ${
                  p.estado === 'activo' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {p.estado}
              </p>

              <p className="text-sm text-gray-400">
                Creado el:{' '}
                {new Date(p.created_at).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </p>
              <AdminActions
                onEdit={() => openModal(p)}
                onDelete={() => handleDelete(p.id)}
              />
            </motion.div>
          ))}
        </div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-rose-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-rose-600">
            {editId ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows="3"
            />
            <select
              value={formValues.categoria_id}
              onChange={(e) =>
                setFormValues({ ...formValues, categoria_id: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Precio"
              value={formValues.precio}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  precio: e.target.value
                })
              }
              min="0"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <input
              type="number"
              placeholder="Descuento (%)"
              value={formValues.descuento_porcentaje || ''}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 0) val = 0;
                if (val > 100) val = 100;
                setFormValues({ ...formValues, descuento_porcentaje: val });
              }}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* <input
              type="text"
              placeholder="URL de Imagen"
              value={formValues.imagen_url}
              onChange={(e) =>
                setFormValues({ ...formValues, imagen_url: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            /> */}
            <select
              value={formValues.estado}
              onChange={(e) =>
                setFormValues({ ...formValues, estado: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={!!confirmDelete}
          onRequestClose={() => setConfirmDelete(null)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-yellow-500"
        >
          <h2 className="text-xl font-bold text-yellow-600 mb-4">
            Advertencia
          </h2>
          <p className="mb-6 text-gray-800">{warningMessage}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  // Eliminar stock primero
                  await axios.delete(
                    `http://localhost:8080/stock/producto/${confirmDelete}`
                  );
                  // Luego eliminar producto
                  await axios.delete(
                    `http://localhost:8080/productos/${confirmDelete}`
                  );
                  setConfirmDelete(null);
                  fetchData();
                } catch (error) {
                  console.error('Error al eliminar con forzado:', error);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProductosGet;
