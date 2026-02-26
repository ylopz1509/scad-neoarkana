document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "documentosSCAD";

  const contenedor = document.getElementById("contenedor-alertas");
  const sinAlertas = document.getElementById("sin-alertas");

  if (!contenedor) return; // evita errores si no es la página correcta

  const DIAS_ALERTA = 30;
  const HOY = new Date();

  let documentos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  function extraerFecha(texto) {
    if (!texto) return null;

    const match = texto.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (!match) return null;

    const [dia, mes, anio] = match[1].split("/");
    return new Date(`${anio}-${mes}-${dia}`);
  }

  function crearAlerta(doc, mensaje, config) {

    const alerta = document.createElement("div");

    alerta.className = `
      bg-white border border-slate-100 rounded-2xl p-6 shadow-sm 
      hover:shadow-md transition flex items-center gap-6 
      border-l-[6px] ${config.border}
    `;

    alerta.innerHTML = `
      <div class="${config.iconBg} p-4 rounded-xl text-xl ${config.iconColor}">
        <i class="fas ${config.icon}"></i>
      </div>

      <div class="flex-grow">
        <h3 class="font-bold text-slate-800 text-lg">
          ${doc.nombre || "Documento"}
        </h3>

        <p class="text-sm text-slate-500 mt-1">
          Vigencia: ${doc.vigenciaTexto || "No especificada"}
        </p>

        <p class="text-xs font-semibold mt-2 ${config.textColor}">
          ${mensaje}
        </p>
      </div>
    `;

    contenedor.appendChild(alerta);
  }

  let hayAlertas = false;

  documentos.forEach(doc => {

    const fecha = extraerFecha(doc.vigenciaTexto);
    if (!fecha) return;

    const diferenciaDias = Math.ceil(
      (fecha - HOY) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias < 0) {
      crearAlerta(doc,
        `Vencido hace ${Math.abs(diferenciaDias)} días`,
        {
          border: "border-l-red-500",
          iconBg: "bg-red-50",
          iconColor: "text-red-600",
          icon: "fa-circle-exclamation",
          textColor: "text-red-600"
        }
      );
      hayAlertas = true;
    }

    else if (diferenciaDias <= DIAS_ALERTA) {
      crearAlerta(doc,
        `Próximo a vencer (${diferenciaDias} días restantes)`,
        {
          border: "border-l-amber-500",
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
          icon: "fa-clock",
          textColor: "text-amber-600"
        }
      );
      hayAlertas = true;
    }

    else {
      crearAlerta(doc,
        `Vigente (faltan ${diferenciaDias} días)`,
        {
          border: "border-l-emerald-500",
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
          icon: "fa-check-circle",
          textColor: "text-emerald-600"
        }
      );
      hayAlertas = true;
    }

  });

  if (!hayAlertas && sinAlertas) {
    sinAlertas.classList.remove("hidden");
  }

});