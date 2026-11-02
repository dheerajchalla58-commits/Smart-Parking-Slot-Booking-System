const slotGrid = document.getElementById("slot-grid");
const floorFilter = document.getElementById("floor-filter");
const bookingForm = document.getElementById("booking-form");
const bookingList = document.getElementById("booking-list");
const selectedSlotLabel = document.getElementById("selected-slot-label");
const slotIdInput = document.getElementById("slot-id");
const toast = document.getElementById("toast");

let slots = [];
let selectedSlot = null;
let toastTimer;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.className = "toast", 3000);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Something went wrong.");
  return result;
}

async function loadSlots() {
  try {
    slots = await api("/api/slots");
    renderSlots();
    updateStats();
  } catch (error) {
    slotGrid.innerHTML = `<p class="empty-state">Unable to load parking slots. Please refresh the page.</p>`;
    showToast(error.message, true);
  }
}

function renderSlots() {
  const floor = floorFilter.value;
  const filtered = slots.filter(slot => floor === "All" || slot.floor === floor);
  const floors = [...new Set(filtered.map(slot => slot.floor))];

  if (!filtered.length) {
    slotGrid.innerHTML = '<p class="empty-state">No slots found for this floor.</p>';
    return;
  }

  slotGrid.innerHTML = floors.map(floorName => {
    const floorSlots = filtered.filter(slot => slot.floor === floorName);
    return `<div class="floor-label" style="grid-column:1/-1">${floorName}</div>` +
      floorSlots.map(slot => {
        const booked = slot.status === "Booked";
        const selected = selectedSlot === slot.id;
        return `<button type="button" class="slot ${booked ? "booked" : ""} ${selected ? "selected" : ""}"
          data-slot="${slot.id}" ${booked ? "disabled" : ""} aria-label="Slot ${slot.id}, ${slot.status}">
          <strong>${slot.id}</strong><small>${booked ? "Booked" : slot.type}</small>
        </button>`;
      }).join("");
  }).join("");

  slotGrid.querySelectorAll(".slot:not(:disabled)").forEach(button => {
    button.addEventListener("click", () => selectSlot(button.dataset.slot));
  });
}

function selectSlot(id) {
  selectedSlot = id;
  slotIdInput.value = id;
  selectedSlotLabel.textContent = id;
  renderSlots();
  document.querySelector(".booking-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateStats() {
  const available = slots.filter(slot => slot.status === "Available").length;
  document.getElementById("total-count").textContent = slots.length;
  document.getElementById("available-count").textContent = available;
  document.getElementById("booked-count").textContent = slots.length - available;
}

async function loadBookings() {
  try {
    const bookings = await api("/api/bookings");
    if (!bookings.length) {
      bookingList.innerHTML = '<p class="empty-state">No bookings yet. Reserve a parking slot to see it here.</p>';
      return;
    }
    bookingList.innerHTML = bookings.slice().reverse().map(booking => `
      <article class="booking-item">
        <div><strong>${escapeHTML(booking.customerName)} · ${escapeHTML(booking.slotId)}</strong>
          <small>${escapeHTML(booking.vehicleNumber)} · ${escapeHTML(booking.date)}</small></div>
        <div><strong>${escapeHTML(booking.startTime)} – ${escapeHTML(booking.endTime)}</strong>
          <small>Parking reservation</small></div>
        <button class="cancel-button" type="button" data-cancel="${booking.id}">Cancel</button>
      </article>`).join("");

    bookingList.querySelectorAll("[data-cancel]").forEach(button => {
      button.addEventListener("click", () => cancelBooking(button.dataset.cancel));
    });
  } catch (error) {
    bookingList.innerHTML = '<p class="empty-state">Unable to load bookings.</p>';
    showToast(error.message, true);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;
  try {
    const result = await api(`/api/bookings/${id}`, { method: "DELETE" });
    if (selectedSlot && slots.find(slot => slot.id === selectedSlot)?.status === "Booked") {
      selectedSlot = null;
      slotIdInput.value = "";
      selectedSlotLabel.textContent = "Choose a slot above";
    }
    showToast(result.message);
    await Promise.all([loadSlots(), loadBookings()]);
  } catch (error) {
    showToast(error.message, true);
  }
}

bookingForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!selectedSlot) {
    showToast("Please select an available parking slot first.", true);
    return;
  }

  const payload = {
    slotId: selectedSlot,
    customerName: document.getElementById("customer-name").value,
    vehicleNumber: document.getElementById("vehicle-number").value,
    date: document.getElementById("booking-date").value,
    startTime: document.getElementById("start-time").value,
    endTime: document.getElementById("end-time").value
  };

  const button = bookingForm.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Booking…";
  try {
    const result = await api("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showToast(result.message);
    bookingForm.reset();
    document.getElementById("booking-date").value = new Date().toISOString().slice(0, 10);
    selectedSlot = null;
    slotIdInput.value = "";
    selectedSlotLabel.textContent = "Choose a slot above";
    await Promise.all([loadSlots(), loadBookings()]);
  } catch (error) {
    showToast(error.message, true);
    await loadSlots();
  } finally {
    button.disabled = false;
    button.innerHTML = 'Confirm reservation <span>→</span>';
  }
});

floorFilter.addEventListener("change", renderSlots);
document.getElementById("refresh-button").addEventListener("click", async () => {
  await Promise.all([loadSlots(), loadBookings()]);
  showToast("Parking information refreshed.");
});

document.getElementById("booking-date").min = new Date().toISOString().slice(0, 10);
document.getElementById("booking-date").value = new Date().toISOString().slice(0, 10);
loadSlots();
loadBookings();