// Simulación de datos (En un caso real vendría de una API)
const permisos = [
    { nombre: "Permiso Ambiental Estatal", fechaVencimiento: "2026-03-10", area: "Ecología" },
    { nombre: "Registro como Reciclador", fechaVencimiento: "2026-02-05", area: "Legal" },
    { nombre: "Bitácora de Residuos", fechaVencimiento: "2025-12-20", area: "Operaciones" }
];

const DIAS_ALERTA = 30;
const HOY = new Date();
const contenedor = document.getElementById("contenedor-alertas");
const sinAlertas = document.getElementById("sin-alertas");

function formatearFecha(fecha) {
    return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function crearAlerta(permiso, config, mensaje, dias) {
    const alerta = document.createElement("div");
    // Clases de Tailwind para un look moderno y corporativo
    alerta.className = `bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center gap-6 border-l-[6px] ${config.border}`;

    alerta.innerHTML = `
        <div class="${config.iconBg} p-4 rounded-xl text-2xl ${config.iconColor}">
            <i class="fas ${config.icono}"></i>
        </div>
        
        <div class="flex-grow">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400">${permiso.area}</span>
                <span class="h-1 w-1 bg-gray-300 rounded-full"></span>
                <span class="text-xs font-semibold ${config.textColor}">${mensaje}</span>
            </div>
            <h3 class="font-bold text-slate-800 text-xl">${permiso.nombre}</h3>
            <p class="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <i class="far fa-calendar-alt"></i> Expira el ${formatearFecha(new Date(permiso.fechaVencimiento))}
            </p>
        </div>

        <div class="flex gap-2 w-full md:w-auto">
            <button class="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors">
                Detalles
            </button>
            <button class="flex-1 md:flex-none px-4 py-2 ${config.btnBg} text-white rounded-lg font-semibold text-sm transition-transform active:scale-95">
                Renovar Ahora
            </button>
        </div>
    `;

    contenedor.appendChild(alerta);
}

let hayAlertas = false;

permisos.forEach(permiso => {
    const fechaV = new Date(permiso.fechaVencimiento);
    const diferenciaDias = Math.ceil((fechaV - HOY) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) {
        hayAlertas = true;
        crearAlerta(permiso, {
            border: "border-l-red-500",
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            icon: "fa-circle-exclamation",
            textColor: "text-red-600",
            btnBg: "bg-red-600 hover:bg-red-700"
        }, `Vencido hace ${Math.abs(diferenciaDias)} días`);
    } 
    else if (diferenciaDias <= DIAS_ALERTA) {
        hayAlertas = true;
        crearAlerta(permiso, {
            border: "border-l-amber-500",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            icon: "fa-clock",
            textColor: "text-amber-600",
            btnBg: "bg-[#00a676] hover:bg-[#008f65]" // Verde corporativo para la acción
        }, `Próximo a vencer (${diferenciaDias} días)`);
    }
});

if (!hayAlertas) sinAlertas.classList.remove("hidden");