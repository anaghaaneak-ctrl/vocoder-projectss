// ================================
// SMART LOCKER BACKEND - server.js
// ================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- SERVE FRONTEND ----------
app.use(express.static(path.join(__dirname, "frontend")));

// ---------- TEST ROUTE ----------
app.get("/check", (req, res) => {
  res.json({ message: "Backend works successfully" });
});

// ---------- OPEN FRONTEND ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "qr.html"));
});

// ---------- ESP32 IP (CHANGE LATER) ----------
const ESP32_IP = "http://192.168.1.45"; // CHANGE to your ESP32 IP

// ---------- CALL ESP32 ----------
async function callEspUnlock() {
  const url = "${ESP32_IP}/unlock";
  try {
    const response = await fetch(url);
    const text = await response.text();
    return { success: true, response: text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ---------- VERIFY QR ----------
app.post("/api/verifyQR", async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.json({ success: false, message: "No QR data received" });
    }

    // Example QR format: LOCKER1,1234
    const parts = qrData.split(",");
    const lockerId = parts[0];
    const otp = parts[1];

    if (!lockerId || !otp) {
      return res.json({ success: false, message: "Invalid QR format" });
    }

    // (For demo: accept any QR)
    const espResult = await callEspUnlock();

    if (espResult.success) {
      res.json({
        success: true,
        message: "QR verified. Locker unlocked!",
        esp: espResult.response,
      });
    } else {
      res.json({
        success: false,
        message: "QR verified but ESP32 not reachable",
        error: espResult.error,
      });
    }
  } catch (err) {
    res.json({ success: false, message: "Server error" });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});