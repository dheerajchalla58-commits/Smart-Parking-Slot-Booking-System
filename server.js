const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "parking.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const initialSlots = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `A${String(i + 1).padStart(2, "0")}`,
    type: i < 2 ? "EV" : "Regular",
    floor: "Ground Floor"
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `B${String(i + 1).padStart(2, "0")}`,
    type: i < 2 ? "Accessible" : "Regular",
    floor: "First Floor"
  }))
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ slots: initialSlots, bookings: [] }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function publicSlots(data) {
  return data.slots.map(slot => {
    const booking = data.bookings.find(item => item.slotId === slot.id);
    return { ...slot, status: booking ? "Booked" : "Available", booking: booking || null };
  });
}

app.get("/api/slots", (req, res) => {
  const data = readData();
  res.json(publicSlots(data));
});

app.post("/api/bookings", (req, res) => {
  const { slotId, customerName, vehicleNumber, date, startTime, endTime } = req.body;

  if (![slotId, customerName, vehicleNumber, date, startTime, endTime].every(value =>
    typeof value === "string" && value.trim()
  )) {
    return res.status(400).json({ message: "Please fill in all booking details." });
  }

  if (endTime <= startTime) {
    return res.status(400).json({ message: "End time must be later than start time." });
  }

  const data = readData();
  const slot = data.slots.find(item => item.id === slotId);
  if (!slot) return res.status(404).json({ message: "Parking slot not found." });

  const alreadyBooked = data.bookings.some(item => item.slotId === slotId);
  if (alreadyBooked) return res.status(409).json({ message: "This slot has already been booked." });

  const booking = {
    id: crypto.randomUUID(),
    slotId,
    customerName: customerName.trim(),
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    date,
    startTime,
    endTime,
    createdAt: new Date().toISOString()
  };

  data.bookings.push(booking);
  writeData(data);
  res.status(201).json({ message: "Parking slot booked successfully.", booking });
});

app.delete("/api/bookings/:id", (req, res) => {
  const data = readData();
  const index = data.bookings.findIndex(item => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Booking not found." });

  const [cancelled] = data.bookings.splice(index, 1);
  writeData(data);
  res.json({ message: `Booking for slot ${cancelled.slotId} cancelled successfully.` });
});

app.get("/api/bookings", (req, res) => {
  const data = readData();
  res.json(data.bookings);
});

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

ensureDataFile();
app.listen(PORT, () => {
  console.log(`Smart Parking app is running at http://localhost:${PORT}`);
});