const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.static('public'));

// ============================================
// POST /data - Recibe datos de estudiantes y ESP32
// ============================================
app.post("/data", (req, res) => {
    const datosRecibidos = req.body;

    if (!datosRecibidos || Object.keys(datosRecibidos).length === 0) {
        return res.status(400).json({
            error: "No se enviaron datos",
            sugerencia: "Envía un JSON con los datos del sensor"
        });
    }

    try {
        // Leer datos existentes
        let datosGuardados = [];
        try {
            const dataLocal = fs.readFileSync('datos.json', 'utf8');
            datosGuardados = JSON.parse(dataLocal);
        } catch (e) {
            console.log("📝 Creando nuevo archivo de datos");
        }

        // Agregar timestamp y metadata
        const nuevoRegistro = {
            ...datosRecibidos,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'] || 'unknown'
        };

        // Agregar al array
        datosGuardados.push(nuevoRegistro);

        // Guardar en archivo
        fs.writeFileSync('datos.json', JSON.stringify(datosGuardados, null, 2));

        console.log(`✅ Datos guardados (total: ${datosGuardados.length} registros)`);

        res.json({
            mensaje: "✅ Datos recibidos y guardados correctamente",
            totalRegistros: datosGuardados.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({
            error: "No se pudieron guardar los datos",
            mensaje: error.message
        });
    }
});

// ============================================
// GET /data - Consultar todos los datos
// ============================================
app.get("/data", (req, res) => {
    try {
        const dataLocal = fs.readFileSync('datos.json', 'utf8');
        const datos = JSON.parse(dataLocal);
        res.json(datos);
    } catch (e) {
        res.json([]);
    }
});

// ============================================
// GET /dashboard - Dashboard web
// ============================================
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ============================================
// GET / - Estado del servicio
// ============================================
app.get("/", (req, res) => {
    res.json({
        servicio: "Callback IoT para Estudiantes",
        endpoints: {
            "POST /data": "Enviar datos de sensores",
            "GET /data": "Ver todos los datos",
            "GET /dashboard": "Dashboard web"
        },
        instrucciones: {
            metodo: "POST",
            url: "https://callback-iot-service-production.up.railway.app/data",
            body: '{"temperatura": 25.5, "humedad": 60, "device": "mi_sensor"}',
            headers: '{"Content-Type": "application/json"}'
        }
    });
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(PORT, () => {
    console.log(`✅ Servicio funcionando en puerto ${PORT}`);
    console.log(`📊 GET /data  -> https://callback-iot-service-production.up.railway.app/data`);
    console.log(`📤 POST /data -> https://callback-iot-service-production.up.railway.app/data`);
    console.log(`📱 Dashboard -> https://callback-iot-service-production.up.railway.app/dashboard`);
});
