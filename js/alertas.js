const DIAS_ALERTA = 30;
const HOY = new Date();
const contenedor = document.getElementById("contenedor-alertas");
const sinAlertas = document.getElementById("sin-alertas");

let documentos = JSON.parse(localStorage.getItem("documentos")) || [];

// ============================
// UTILIDADES
// ============================

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function extraerFechaDesdeTexto(texto) {
  if (!texto) return null;

  const match = texto.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (!match) return null;

  const [dia, mes, anio] = match[1].split("/");
  return new Date(`${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`);
}

// ============================
// CREAR ALERTA
// ============================

function crearAlerta(doc, estado, mensaje, colorConfig) {

  const alerta = document.createElement("div");

  alerta.className = `
    bg-white border border-slate-100 rounded-2xl p-6 shadow-sm 
    hover:shadow-md transition flex items-center gap-6 
    border-l-[6px] ${colorConfig.border}
  `;

  alerta.innerHTML = `
    <div class="${colorConfig.iconBg} p-4 rounded-xl text-xl ${colorConfig.iconColor}">
      <i class="fas ${colorConfig.icon}"></i>
    </div>

    <div class="flex-grow">
      <h3 class="font-bold text-slate-800 text-lg">
        ${doc.nombre}
      </h3>

      <p class="text-sm text-slate-500 mt-1">
        Vigencia: ${doc.vigenciaTexto || "No especificada"}
      </p>

      <p class="text-xs font-semibold mt-2 ${colorConfig.textColor}">
        ${mensaje}
      </p>
    </div>
  `;

  contenedor.appendChild(alerta);
}

// ============================
// PROCESAR DOCUMENTOS
// ============================

let hayDocumentos = false;

documentos.forEach(doc => {

  if (!doc.vigenciaTexto) return;

  hayDocumentos = true;

  const fecha = extraerFechaDesdeTexto(doc.vigenciaTexto);

  // 🔵 SIN FECHA VÁLIDA
  if (!fecha) {
    crearAlerta(doc, "informativo",
      "Requiere validación manual (sin fecha detectada)",
      {
        border: "border-l-blue-500",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        icon: "fa-circle-info",
        textColor: "text-blue-600"
      }
    );
    return;
  }

  const diferenciaDias = Math.ceil(
    (fecha - HOY) / (1000 * 60 * 60 * 24)
  );

  // 🔴 VENCIDO
  if (diferenciaDias < 0) {
    crearAlerta(doc, "vencido",
      `Vencido hace ${Math.abs(diferenciaDias)} días`,
      {
        border: "border-l-red-500",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        icon: "fa-circle-exclamation",
        textColor: "text-red-600"
      }
    );
  }

  // 🟡 PRÓXIMO A VENCER
  else if (diferenciaDias <= DIAS_ALERTA) {
    crearAlerta(doc, "proximo",
      `Próximo a vencer (${diferenciaDias} días restantes)`,
      {
        border: "border-l-amber-500",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        icon: "fa-clock",
        textColor: "text-amber-600"
      }
    );
  }

  // 🟢 VIGENTE
  else {
    crearAlerta(doc, "vigente",
      `Vigente (faltan ${diferenciaDias} días)`,
      {
        border: "border-l-emerald-500",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        icon: "fa-check-circle",
        textColor: "text-emerald-600"
      }
    );
  }

});

// ============================
// SI NO HAY DOCUMENTOS CON VIGENCIA
// ============================

if (!hayDocumentos) {
  sinAlertas.classList.remove("hidden");
}