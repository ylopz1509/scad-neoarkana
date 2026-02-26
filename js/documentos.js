// ============================
// VARIABLES Y CONFIGURACIÓN
// ============================
const modal = document.getElementById("modal-subir");
const btnAbrir = document.getElementById("btn-abrir-modal");
const btnCerrar = document.getElementById("btn-cerrar-modal");
const btnCancelar = document.getElementById("btn-cancelar");
const form = document.getElementById("form-documento");
const contenedor = document.getElementById("contenedor-documentos");
const filtro = document.getElementById("filtro-documentos");

let documentos = JSON.parse(localStorage.getItem("documentos")) || [];

// ============================
// ANÁLISIS HÍBRIDO (IA + RESPALDO)
// ============================

async function analizarDocumento(nombreArchivo) {
  try {
    const response = await fetch("http://localhost:3000/analizar-documento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreArchivo })
    });

    if (!response.ok) throw new Error("Backend offline");

    const data = await response.json();
    return data.resultado.replace(/\n/g, '<br>');

  } catch (error) {
    console.warn("⚠️ Activando simulación local por falla de conexión.");
    return simularAnalisisLocal(nombreArchivo);
  }
}

function simularAnalisisLocal(nombre) {
  const n = nombre.toLowerCase();
  let tipo = "Documento General";
  let desc = "Archivo registrado en el sistema de gestión SCAD.";
  let vigencia = "Pendiente de validación manual.";

  if (n.includes("factura") || n.includes("recibo") || n.includes("pago") || n.includes("xml")) {
    tipo = "Comprobante Fiscal";
    desc = "Documento financiero de ingresos/egresos.";
    vigencia = "Sujeto a validación fiscal.";
  } else if (n.includes("contrato") || n.includes("legal") || n.includes("convenio")) {
    tipo = "Documento Legal";
    desc = "Acuerdo formal o términos de servicio.";
    vigencia = "Vigencia según cláusulas.";
  } else if (n.includes("ine") || n.includes("id") || n.includes("cedula")) {
    tipo = "Identificación Oficial";
    desc = "Documento de identidad personal.";
    vigencia = "Verificar fecha de expiración.";
  }

  return `<strong>[ANÁLISIS DE SISTEMA]</strong><br>
          <strong>Tipo:</strong> ${tipo}<br>
          <strong>Descripción:</strong> ${desc}<br>
          <strong>Vigencia:</strong> ${vigencia}`;
}

// ============================
// FUNCIONES UI
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo-documento").value;
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!tipo || !archivo) {
    alert("Por favor, completa los campos.");
    return;
  }

  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.textContent = "Analizando...";
  btnSubmit.disabled = true;

  const reader = new FileReader();

  reader.onload = async function () {
    try {
      const analisis = await analizarDocumento(archivo.name);

      const nuevoDocumento = {
        id: Date.now(),
        nombre: archivo.name,
        tipo: tipo,
        fecha: new Date().toLocaleDateString(),
        tamaño: (archivo.size / 1024).toFixed(2) + " KB",
        contenido: reader.result,
        analisis: analisis
      };

      documentos.push(nuevoDocumento);
      localStorage.setItem("documentos", JSON.stringify(documentos));

      renderizarDocumentos();
      cerrarModal();

    } catch (err) {
      console.error(err);
      alert("Error al procesar el documento.");
    } finally {
      btnSubmit.textContent = "Guardar";
      btnSubmit.disabled = false;
    }
  };

  reader.readAsDataURL(archivo);
});

function renderizarDocumentos() {
  contenedor.innerHTML = "";
  const filtroActual = filtro.value;

  const docsFiltrados = documentos.filter(doc =>
    filtroActual === "todos" || doc.tipo === filtroActual
  );

  if (docsFiltrados.length === 0) {
    contenedor.innerHTML =
      `<div class="col-span-3 text-center text-gray-400 py-10">
        No hay documentos registrados.
      </div>`;
    return;
  }

  docsFiltrados.forEach(doc => {
    contenedor.innerHTML += `
      <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition duration-300">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-gray-800 text-lg truncate">${doc.nombre}</h3>
          <button onclick="eliminarDocumento(${doc.id})" class="text-gray-400 hover:text-red-600 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <p class="text-xs text-gray-400 mb-2">Subido: ${doc.fecha} | ${doc.tamaño}</p>
        <div class="flex justify-between items-center">
          <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
            ${doc.tipo.toUpperCase()}
          </span>
          <a href="${doc.contenido}" target="_blank"
            class="text-blue-600 text-sm hover:underline font-medium">
            Ver archivo
          </a>
        </div>
        <div class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed border-l-4 border-blue-500">
          ${doc.analisis}
        </div>
      </div>
    `;
  });
}

function eliminarDocumento(id) {
  if (!confirm("¿Deseas eliminar este registro?")) return;

  documentos = documentos.filter(doc => doc.id !== id);
  localStorage.setItem("documentos", JSON.stringify(documentos));
  renderizarDocumentos();
}

filtro.addEventListener("change", renderizarDocumentos);