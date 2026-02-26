const modal = document.getElementById("modal-subir");
const btnAbrir = document.getElementById("btn-abrir-modal");
const btnCerrar = document.getElementById("btn-cerrar-modal");
const btnCancelar = document.getElementById("btn-cancelar");
const form = document.getElementById("form-documento");
const contenedor = document.getElementById("contenedor-documentos");
const filtro = document.getElementById("filtro-documentos");

let documentos = JSON.parse(localStorage.getItem("documentos")) || [];


// ============================
// EXTRAER VIGENCIA
// ============================
function extraerTextoVigencia(analisisHTML) {
  const textoPlano = analisisHTML
    .replace(/<br>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();

  const match = textoPlano.match(/Vigencia\s*:\s*(.+)/i);

  if (match && match[1]) {
    return match[1].trim();
  }

  return "Verificar manualmente por parte de SCAD";
}


// ============================
// ANALIZAR DOCUMENTO (ENVÍA SOLO NOMBRE)
// ============================
async function analizarDocumento(nombreArchivo) {
  try {
    console.log("📤 Enviando nombre al backend:", nombreArchivo);

    const response = await fetch("http://127.0.0.1:3000/analizar-documento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombreArchivo })
    });

    if (!response.ok) {
      throw new Error("Error en backend");
    }

    const data = await response.json();

    console.log("📥 RESPUESTA BACKEND:", data);

    return data.resultado.replace(/\n/g, "<br>");

  } catch (error) {

    console.warn("⚠️ No hay conexión con IA, activando modo respaldo.");

    return `
      <strong>Tipo:</strong> Documento General<br>
      <strong>Descripción:</strong> Documento pendiente de análisis automático.<br>
      <strong>Vigencia:</strong> Verificar manualmente por parte de SCAD
    `;
  }
}


// ============================
// INICIALIZAR
// ============================
document.addEventListener("DOMContentLoaded", () => {
  renderizarDocumentos();
});

btnAbrir.addEventListener("click", () => modal.classList.remove("hidden"));
btnCerrar.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

function cerrarModal() {
  modal.classList.add("hidden");
  form.reset();

  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = false;
  btnSubmit.textContent = "Guardar";
}


// ============================
// SUBIR DOCUMENTO
// ============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipoSeleccionado = document.getElementById("tipo-documento").value;
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!tipoSeleccionado || !archivo) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.textContent = "Analizando con IA...";
  btnSubmit.disabled = true;

  try {

    // 🔥 SOLO ENVIAMOS EL NOMBRE
    const analisis = await analizarDocumento(archivo.name);
    const vigenciaTexto = extraerTextoVigencia(analisis);

    const nuevoDocumento = {
      id: Date.now(),
      nombre: archivo.name,
      tipo: tipoSeleccionado,
      fecha: new Date().toLocaleDateString(),
      tamaño: (archivo.size / 1024).toFixed(2) + " KB",
      analisis: analisis,
      vigenciaTexto: vigenciaTexto
    };

    documentos.push(nuevoDocumento);
    localStorage.setItem("documentos", JSON.stringify(documentos));

    renderizarDocumentos();
    cerrarModal();

  } catch (error) {
    console.error(error);
    alert("Error al procesar el documento.");
  } finally {
    btnSubmit.textContent = "Guardar";
    btnSubmit.disabled = false;
  }
});


// ============================
// RENDER DOCUMENTOS
// ============================
function renderizarDocumentos() {
  contenedor.innerHTML = "";

  const filtroActual = filtro.value;

  const docsFiltrados = documentos.filter(doc =>
    filtroActual === "todos" || doc.tipo === filtroActual
  );

  if (docsFiltrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-3 text-center text-gray-400 py-10">
        No hay documentos registrados.
      </div>`;
    return;
  }

  docsFiltrados.forEach(doc => {
    contenedor.innerHTML += `
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition">
        
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-slate-800 text-lg truncate">
            ${doc.nombre}
          </h3>

          <button onclick="eliminarDocumento(${doc.id})"
            class="text-gray-400 hover:text-red-600 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <p class="text-xs text-gray-400 mb-3">
          Subido: ${doc.fecha} | ${doc.tamaño}
        </p>

        <div class="flex justify-between items-center mb-4">
          <span class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
            ${doc.tipo.toUpperCase()}
          </span>
        </div>

        <p class="text-xs text-amber-600 font-semibold mb-3">
          Vigencia: ${doc.vigenciaTexto}
        </p>

        <div class="mt-3 p-4 bg-slate-50 rounded-xl text-xs text-gray-700 leading-relaxed border-l-4 border-amber-500">
          ${doc.analisis}
        </div>

      </div>
    `;
  });
}


// ============================
// ELIMINAR
// ============================
function eliminarDocumento(id) {
  if (!confirm("¿Deseas eliminar este documento?")) return;

  documentos = documentos.filter(doc => doc.id !== id);
  localStorage.setItem("documentos", JSON.stringify(documentos));
  renderizarDocumentos();
}

filtro.addEventListener("change", renderizarDocumentos);