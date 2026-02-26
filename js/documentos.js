document.addEventListener('DOMContentLoaded', () => {

  const STORAGE_KEY = "documentosSCAD";

  const btnAbrirModal = document.getElementById('btn-abrir-modal');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const btnCancelar = document.getElementById('btn-cancelar');
  const modalSubir = document.getElementById('modal-subir');
  const form = document.getElementById('form-documento');
  const btnSubmit = form.querySelector('button[type="submit"]');
  const contenedor = document.getElementById("contenedor-documentos");

  let documentos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  renderizarDocumentos();

  // ================================
  // MODAL
  // ================================
  btnAbrirModal?.addEventListener('click', () => {
    modalSubir.classList.remove('hidden');
  });

  const cerrarModal = () => {
    modalSubir.classList.add('hidden');
    form.reset();
  };

  btnCerrarModal?.addEventListener('click', cerrarModal);
  btnCancelar?.addEventListener('click', cerrarModal);

  // ================================
  // SUBMIT
  // ================================
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const archivo = document.getElementById('archivo')?.files[0];
    if (!archivo) {
      alert("Selecciona un PDF.");
      return;
    }

    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analizando...`;
    btnSubmit.disabled = true;

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {

      const respuesta = await fetch("http://127.0.0.1:3000/analizar-documento", {
        method: "POST",
        body: formData
      });

      const data = await respuesta.json();

      const tipoMatch = data.resultado?.match(/Tipo:\s*(.*)/i);
      const descripcionMatch = data.resultado?.match(/Descripción:\s*(.*)/i);
      const vigenciaMatch = data.resultado?.match(/Vigencia:\s*(.*)/i);

      const nuevoDocumento = {
        id: Date.now(),
        nombre: tipoMatch ? tipoMatch[1].trim() : "Documento",
        descripcion: descripcionMatch ? descripcionMatch[1].trim() : "",
        vigenciaTexto: vigenciaMatch ? vigenciaMatch[1].trim() : "",
        fechaSubida: new Date().toISOString()
      };

      documentos.push(nuevoDocumento);
      guardarEnLocalStorage();
      renderizarDocumentos();
      cerrarModal();

    } catch (error) {
      alert("Error al conectar con el servidor.");
    } finally {
      btnSubmit.innerHTML = `<i class="fas fa-check"></i> Guardar Documento`;
      btnSubmit.disabled = false;
    }
  });

  // ================================
  // GUARDAR
  // ================================
  function guardarEnLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documentos));
  }

  // ================================
  // RENDERIZAR
  // ================================
  function renderizarDocumentos() {

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (documentos.length === 0) {
      contenedor.innerHTML = `
        <div class="col-span-full text-center text-gray-400 py-20">
          <i class="fas fa-folder-open text-4xl mb-3"></i>
          <p>No hay documentos registrados.</p>
        </div>
      `;
      return;
    }

    documentos.forEach((doc, index) => {

      const estado = verificarVigencia(doc.vigenciaTexto);

      const card = document.createElement("div");
      card.className = `
        bg-white rounded-2xl shadow-md p-5 border
        hover:shadow-xl transition-all duration-300
      `;

      card.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-lg text-slate-800">
            ${doc.nombre || "Documento"}
          </h3>
          <span class="text-xs px-3 py-1 rounded-full font-semibold
            ${estado === "Vigente" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">
            ${estado}
          </span>
        </div>

        <p class="text-sm text-gray-600 mb-4">
          ${doc.descripcion || "Sin descripción"}
        </p>

        <div class="text-sm text-slate-700 font-medium mb-4">
          📅 ${doc.vigenciaTexto || "No especificada"}
        </div>

        <button onclick="eliminarDocumento(${index})"
          class="text-red-500 hover:text-red-700 text-sm font-semibold">
          Eliminar
        </button>
      `;

      contenedor.appendChild(card);
    });
  }

  // ================================
  // VERIFICAR VIGENCIA (BLINDADA)
  // ================================
  function verificarVigencia(vigenciaTexto) {

    if (!vigenciaTexto) return "Vigente";

    const match = vigenciaTexto.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (!match) return "Vigente";

    const [dia, mes, anio] = match[1].split("/");
    const fecha = new Date(`${anio}-${mes}-${dia}`);

    return fecha < new Date() ? "Vencido" : "Vigente";
  }

  // ================================
  // ELIMINAR
  // ================================
  window.eliminarDocumento = function(index) {
    documentos.splice(index, 1);
    guardarEnLocalStorage();
    renderizarDocumentos();
  };

});