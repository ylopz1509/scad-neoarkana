// ==========================
// Esperar a que cargue el DOM
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    const session = window.SCADAUTH.getSession();

    if (!session) return;

    // ==========================
    // Mostrar empresa activa
    // ==========================
    const empresaElemento = document.getElementById("empresaActiva");
    if (empresaElemento) {
        empresaElemento.textContent = session.empresa || "Empresa no encontrada";
    }

    // ==========================
    // Claves por usuario
    // ==========================
    const HISTORIAL_KEY = "scad_historial_" + session.email;
    const PERMISOS_KEY = "scad_permisos_" + session.email;
    const EVIDENCIAS_KEY = "scad_evidencias_" + session.email;

    // ==========================
    // Datos simulados
    // ==========================
    if (!localStorage.getItem(PERMISOS_KEY)) {
        localStorage.setItem(PERMISOS_KEY, JSON.stringify([
            { nombre: "Registro Ambiental", estado: "Vigente", fecha: "2026-01-10" },
            { nombre: "Licencia Municipal", estado: "Vencido", fecha: "2025-12-01" }
        ]));
    }

    if (!localStorage.getItem(EVIDENCIAS_KEY)) {
        localStorage.setItem(EVIDENCIAS_KEY, JSON.stringify([
            { nombre: "Foto Almacén", fecha: "2026-02-01" },
            { nombre: "Bitácora Enero", fecha: "2026-02-05" }
        ]));
    }

    // ==========================
    // HISTORIAL
    // ==========================
    function guardarHistorial(tipo, periodo) {

        const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY)) || [];

        historial.push({
            tipo,
            periodo,
            fecha: new Date().toLocaleString(),
            empresa: session.empresa
        });

        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
        renderHistorial();
    }

    function renderHistorial() {

        const container = document.getElementById("historialContainer");
        const historial = JSON.parse(localStorage.getItem(HISTORIAL_KEY)) || [];

        container.innerHTML = "";

        if (historial.length === 0) {
            container.innerHTML = "<p class='text-slate-500'>No hay reportes generados aún.</p>";
            return;
        }

        historial.slice().reverse().forEach(item => {
            container.innerHTML += `
                <div class="border rounded-xl p-4">
                    <p class="font-semibold">${item.tipo}</p>
                    <p class="text-sm text-slate-600">Periodo: ${item.periodo}</p>
                    <p class="text-sm text-slate-500">
                        Generado por ${item.empresa} el ${item.fecha}
                    </p>
                </div>
            `;
        });
    }

    renderHistorial();

    // ==========================
    // GENERAR PDF PROFESIONAL
    // ==========================
    window.generarPDF = function () {

        const periodo = document.getElementById("periodo").value;
        const tipo = document.getElementById("tipoReporte").value;

        if (!periodo) {
            alert("Selecciona un periodo");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const permisos = JSON.parse(localStorage.getItem(PERMISOS_KEY)) || [];
        const evidencias = JSON.parse(localStorage.getItem(EVIDENCIAS_KEY)) || [];

        // TÍTULO
        doc.setFontSize(20);
        doc.text("REPORTE OFICIAL SCAD", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Empresa: ${session.empresa}`, 14, 40);
        doc.text(`Periodo: ${periodo}`, 14, 48);
        doc.text(`Tipo de reporte: ${tipo}`, 14, 56);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 64);

        let y = 80;

        // PERMISOS
        doc.setFontSize(14);
        doc.text("Permisos", 14, y);
        y += 10;

        doc.setFontSize(11);

        permisos.forEach(p => {
            doc.text(`• ${p.nombre} | ${p.estado} | ${p.fecha}`, 14, y);
            y += 8;
        });

        y += 10;

        // EVIDENCIAS
        doc.setFontSize(14);
        doc.text("Evidencias", 14, y);
        y += 10;

        doc.setFontSize(11);

        evidencias.forEach(e => {
            doc.text(`• ${e.nombre} | ${e.fecha}`, 14, y);
            y += 8;
        });

        doc.save(`Reporte_SCAD_${periodo}.pdf`);

        guardarHistorial(tipo + " (PDF)", periodo);
    };

    // ==========================
    // GENERAR EXCEL PROFESIONAL
    // ==========================
    window.generarExcel = function () {

        const periodo = document.getElementById("periodo").value;
        const tipo = document.getElementById("tipoReporte").value;

        if (!periodo) {
            alert("Selecciona un periodo");
            return;
        }

        const permisos = JSON.parse(localStorage.getItem(PERMISOS_KEY)) || [];
        const evidencias = JSON.parse(localStorage.getItem(EVIDENCIAS_KEY)) || [];

        const datos = [
            ["REPORTE OFICIAL SCAD"],
            [],
            ["Empresa", session.empresa],
            ["Periodo", periodo],
            ["Tipo de reporte", tipo],
            ["Fecha", new Date().toLocaleDateString()],
            [],
            ["PERMISOS"],
            ["Nombre", "Estado", "Fecha"]
        ];

        permisos.forEach(p => {
            datos.push([p.nombre, p.estado, p.fecha]);
        });

        datos.push([]);
        datos.push(["EVIDENCIAS"]);
        datos.push(["Nombre", "Fecha"]);

        evidencias.forEach(e => {
            datos.push([e.nombre, e.fecha]);
        });

        const ws = XLSX.utils.aoa_to_sheet(datos);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte SCAD");

        XLSX.writeFile(wb, `Reporte_SCAD_${periodo}.xlsx`);

        guardarHistorial(tipo + " (Excel)", periodo);
    };

});