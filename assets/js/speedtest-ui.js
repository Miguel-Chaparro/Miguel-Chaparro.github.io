/**
 * Dommatos Speed Test UI Controller
 * Powered by LibreSpeed Engine
 */

class SpeedTestUI {
    constructor() {
        this.worker = null;
        this.testState = 0; // 0: Idle, 1: Testing, 2: Done
        this.results = {
            download: 0,
            upload: 0,
            ping: 0,
            jitter: 0,
            ip: ''
        };

        // DOM Elements
        this.startBtn = document.getElementById('start-test-btn');
        this.statusText = document.getElementById('test-status');
        this.mainValue = document.getElementById('main-speed-value');
        this.uiIp = document.getElementById('ip-address');
        this.uiDownload = document.getElementById('download-speed');
        this.uiUpload = document.getElementById('upload-speed');
        this.uiPing = document.getElementById('ping-value');
        this.uiJitter = document.getElementById('jitter-value');
        this.uiDate = document.getElementById('test-date');

        this.init();
    }

    init() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.toggleTest());
        }
    }

    toggleTest() {
        if (this.testState === 1) {
            this.abortTest();
        } else {
            this.startTest();
        }
    }

    startTest() {
        this.testState = 1;
        this.resetUI();
        
        // Update Button
        this.startBtn.innerText = 'DETENER';
        this.startBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'shadow-red-500/20');
        this.startBtn.classList.remove('bg-primary', 'hover:bg-yellow-400');

        this.worker = new Worker('assets/js/speedtest_worker.js');
        
        this.worker.onmessage = (e) => {
            const data = e.data.split(';');
            const status = data[0]; // 0: Idle, 1: DL, 2: UL, 3: Ping, 4: Done, 5: Error

            if (status === "1") { // Download
                this.results.download = data[1];
                this.updateGauge('download', data[1]);
                this.updateStatus('Midiendo Descarga...', '#60a5fa');
            } else if (status === "2") { // Upload
                this.results.upload = data[2];
                this.updateGauge('upload', data[2]);
                this.updateStatus('Midiendo Carga...', '#4ade80');
            } else if (status === "3") { // Ping/Jitter
                this.results.ping = data[3];
                this.results.jitter = data[4];
                this.updateGauge('ping', data[3]);
                this.updateGauge('jitter', data[4]);
                this.updateStatus('Midiendo Latencia...', '#c084fc');
            } else if (status === "4") { // Done
                this.testState = 2;
                this.results.ip = data[9];
                this.finalizeTest();
            } else if (status === "5") { // Error
                this.abortTest('Error de conexión');
            }
        };

        // Configuration for Azteca Backend
        const config = {
            telemetry_level: "basic",
            url_dl: "https://medidor.azteca-comunicaciones.com/backend/garbage.php",
            url_ul: "https://medidor.azteca-comunicaciones.com/backend/empty.php",
            url_ping: "https://medidor.azteca-comunicaciones.com/backend/empty.php",
            url_getIp: "https://medidor.azteca-comunicaciones.com/backend/getIP.php"
        };

        this.worker.postMessage('start ' + JSON.stringify(config));
    }

    abortTest(msg = 'Cancelado') {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.testState = 0;
        this.updateStatus(msg, '#f43f5e');
        this.resetButton();
    }

    finalizeTest() {
        this.testState = 2;
        this.updateStatus('Completado', '#FDB916');
        this.uiIp.innerText = this.results.ip;
        this.uiDate.innerText = new Date().toLocaleString('es-CO');
        this.resetButton();
        
        // Show download speed as final summary
        this.mainValue.innerText = parseFloat(this.results.download).toFixed(1);
        document.getElementById('main-unit').innerText = 'Mbps';
    }

    resetButton() {
        this.startBtn.innerText = 'VOLVER A PROBAR';
        this.startBtn.classList.remove('bg-red-500', 'hover:bg-red-600', 'shadow-red-500/20');
        this.startBtn.classList.add('bg-primary', 'hover:bg-yellow-400');
    }

    resetUI() {
        this.uiIp.innerText = '...';
        this.uiDownload.innerText = '0.00';
        this.uiUpload.innerText = '0.00';
        this.uiPing.innerText = '0';
        this.uiJitter.innerText = '0';
        this.mainValue.innerText = '0.0';
        
        // Reset gauges
        ['download', 'upload', 'ping', 'jitter'].forEach(type => {
            const circle = document.getElementById(`gauge-${type}`);
            if (circle) circle.style.strokeDashoffset = 628;
        });
    }

    updateStatus(text, color) {
        if (this.statusText) {
            this.statusText.innerText = text;
            this.statusText.style.color = color;
        }
    }

    updateGauge(type, value) {
        const val = parseFloat(value);
        if (isNaN(val)) return;

        // Update Text
        const textElem = document.getElementById(`${type}-speed`);
        if (textElem) textElem.innerText = val.toFixed(type === 'ping' || type === 'jitter' ? 0 : 2);

        // Update Main value if testing that type
        if (this.testState === 1) {
            this.mainValue.innerText = val.toFixed(1);
            const unit = (type === 'ping' || type === 'jitter') ? 'ms' : 'Mbps';
            document.getElementById('main-unit').innerText = unit;
            
            // Highlight active gauge in the main circle
            const mainDl = document.getElementById('gauge-download');
            const mainUl = document.getElementById('gauge-upload');
            if (mainDl) mainDl.style.opacity = (type === 'download') ? '1' : '0.1';
            if (mainUl) mainUl.style.opacity = (type === 'upload') ? '1' : '0.1';
        }

        // Update all SVG Circles for this type (Main and Mini)
        const circles = document.querySelectorAll(`[id^="gauge-${type}"]`);
        circles.forEach(circle => {
            const circumference = 628;
            let max = 1000; // Default max for speed (Mbps)
            if (type === 'ping' || type === 'jitter') max = 200; // Max for ms
            
            const percentage = Math.min((val / max) * 100, 100);
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.speedTest = new SpeedTestUI();
});
