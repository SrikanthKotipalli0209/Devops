// ─── DATA ────────────────────────────────────────────────────────────────────
const buses = [
  { id: 1, name: "Express Rider",   type: "AC Sleeper",    dep: "06:00 AM", arr: "02:00 PM", duration: "8h 00m", seats: 18, price: 49, rating: 4.5, amenities: ["WiFi","AC","Charging"] },
  { id: 2, name: "Swift Travels",   type: "Semi-Sleeper",  dep: "08:30 AM", arr: "05:00 PM", duration: "8h 30m", seats: 32, price: 32, rating: 4.2, amenities: ["AC","Water"] },
  { id: 3, name: "Royal Coach",     type: "AC Seater",     dep: "10:00 AM", arr: "06:30 PM", duration: "8h 30m", seats: 5,  price: 42, rating: 4.7, amenities: ["WiFi","AC","Snacks","Charging"] },
  { id: 4, name: "City Shuttle",    type: "Non-AC Seater", dep: "12:00 PM", arr: "09:00 PM", duration: "9h 00m", seats: 40, price: 22, rating: 3.9, amenities: ["Water"] },
  { id: 5, name: "Luxury Wheels",   type: "AC Sleeper",    dep: "09:00 PM", arr: "05:00 AM", duration: "8h 00m", seats: 12, price: 65, rating: 4.8, amenities: ["WiFi","AC","Pillow","Charging","Snacks"] },
];

const bookedSeats = {
  1: [2,5,8,11,14,17,20],
  2: [1,3,4,6,9,12,15,18,21,24,27],
  3: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40],
  4: [],
  5: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39],
};

// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  from: '', to: '', date: '', passengers: 1,
  selectedBus: null, selectedSeats: [], passengerDetails: []
};

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('travelDate').value = today;
  document.getElementById('travelDate').min = today;
});

// ─── NAV ──────────────────────────────────────────────────────────────────────
function goTo(step) {
  [1,2,3,4,5].forEach(i => {
    document.getElementById(`page${i}`)?.classList.add('hidden');
    document.getElementById(`step-ind-${i}`)?.classList.remove('active','done');
  });
  const target = document.getElementById(`page${step}`);
  if (target) {
    target.classList.remove('hidden');
    if (step > 1) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  for (let i = 1; i < step; i++) document.getElementById(`step-ind-${i}`)?.classList.add('done');
  document.getElementById(`step-ind-${step}`)?.classList.add('active');
}

// ─── STEP 1: SEARCH ──────────────────────────────────────────────────────────
function swapCities() {
  const f = document.getElementById('fromCity');
  const t = document.getElementById('toCity');
  [f.value, t.value] = [t.value, f.value];
}

function searchBuses() {
  const from = document.getElementById('fromCity').value;
  const to   = document.getElementById('toCity').value;
  const date = document.getElementById('travelDate').value;
  const pax  = document.getElementById('passengers').value;

  if (!from) return toast('Please select departure city');
  if (!to)   return toast('Please select destination city');
  if (from === to) return toast('Departure and destination cannot be same');
  if (!date) return toast('Please select travel date');

  state = { ...state, from, to, date, passengers: parseInt(pax) };

  document.getElementById('routeTitle').textContent = `${from} → ${to}`;
  document.getElementById('routeDate').innerHTML =
    `${formatDate(date)} · <span id="passCount">${pax}</span> Passenger(s)`;

  renderBusList(buses);
  goTo(2);
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US',
    { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ─── STEP 2: BUS LIST ────────────────────────────────────────────────────────
function renderBusList(list) {
  const container = document.getElementById('busList');
  if (!list.length) {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:#888">No buses found for this route.</div>`;
    return;
  }
  container.innerHTML = list.map(bus => `
    <div class="bus-card" onclick="selectBus(${bus.id})">
      <div class="bus-operator">
        <h4>${bus.name}</h4>
        <p>⭐ ${bus.rating} · ${bus.amenities.join(' · ')}</p>
        <span class="bus-badge ${badgeClass(bus.type)}">${bus.type}</span>
      </div>
      <div class="bus-timing"><h3>${bus.dep}</h3><p>Departure</p></div>
      <div class="bus-duration">
        <div class="duration-line">
          <div class="d-line"></div>
        </div>
        <p>${bus.duration}</p>
      </div>
      <div class="bus-timing"><h3>${bus.arr}</h3><p>Arrival</p></div>
      <div class="bus-seats">
        <h4>${bus.seats}</h4>
        <p>Seats Left</p>
      </div>
      <div class="bus-price">
        <h3>$${bus.price}</h3>
        <p>per seat</p>
      </div>
      <button class="btn-select" onclick="event.stopPropagation();selectBus(${bus.id})">
        Select →
      </button>
    </div>
  `).join('');
}

function badgeClass(type) {
  if (type.includes('Sleeper')) return 'badge-sleeper';
  if (type.includes('Semi'))    return 'badge-semi';
  return 'badge-ac';
}

function sortBuses(by) {
  let sorted = [...buses];
  if (by === 'price') sorted.sort((a,b) => a.price - b.price);
  else if (by === 'time') sorted.sort((a,b) => a.dep.localeCompare(b.dep));
  else if (by === 'seats') sorted.sort((a,b) => b.seats - a.seats);
  renderBusList(sorted);
}

// ─── STEP 3: SEAT SELECTION ──────────────────────────────────────────────────
function selectBus(id) {
  state.selectedBus = buses.find(b => b.id === id);
  state.selectedSeats = [];

  document.getElementById('busName3').textContent = state.selectedBus.name;
  document.getElementById('busInfo3').textContent =
    `${state.selectedBus.dep} → ${state.selectedBus.arr} · ${state.selectedBus.type} · $${state.selectedBus.price}/seat`;

  renderSeats();
  updateSeatSummary();
  goTo(3);
}

function renderSeats() {
  const grid = document.getElementById('seatGrid');
  const taken = bookedSeats[state.selectedBus.id] || [];
  const totalSeats = 40;
  let html = '';
  for (let i = 1; i <= totalSeats; i++) {
    if (i % 5 === 3) {
      html += `<div class="seat aisle"></div>`;
    }
    const isBooked = taken.includes(i);
    const isSelected = state.selectedSeats.includes(i);
    const cls = isBooked ? 'booked' : isSelected ? 'selected' : 'available';
    const click = isBooked ? '' : `onclick="toggleSeat(${i})"`;
    html += `<div class="seat ${cls}" id="seat-${i}" ${click}>${i}</div>`;
  }
  grid.innerHTML = html;
}

function toggleSeat(num) {
  const idx = state.selectedSeats.indexOf(num);
  if (idx > -1) {
    state.selectedSeats.splice(idx, 1);
  } else {
    if (state.selectedSeats.length >= state.passengers) {
      toast(`You can only select ${state.passengers} seat(s)`);
      return;
    }
    state.selectedSeats.push(num);
  }
  const el = document.getElementById(`seat-${num}`);
  el.classList.toggle('selected', state.selectedSeats.includes(num));
  el.classList.toggle('available', !state.selectedSeats.includes(num));
  updateSeatSummary();
}

function updateSeatSummary() {
  const bus   = state.selectedBus;
  const seats = state.selectedSeats;
  document.getElementById('selectedSeatsLabel').textContent = seats.length ? seats.join(', ') : 'None';
  document.getElementById('seatCount').textContent   = seats.length;
  document.getElementById('pricePerSeat').textContent = `$${bus?.price || 0}`;
  document.getElementById('totalPrice').textContent   = `$${(bus?.price || 0) * seats.length}`;
}

function proceedToDetails() {
  if (!state.selectedSeats.length) return toast('Please select at least 1 seat');
  if (state.selectedSeats.length < state.passengers)
    return toast(`Please select ${state.passengers} seat(s) for all passengers`);
  buildPassengerForm();
  updateTripSummary();
  goTo(4);
}

// ─── STEP 4: PASSENGER DETAILS ───────────────────────────────────────────────
function buildPassengerForm() {
  const form = document.getElementById('passengersForm');
  form.innerHTML = state.selectedSeats.map((seat, i) => `
    <div class="passenger-card">
      <h4>Passenger ${i + 1} — Seat ${seat}</h4>
      <div class="form-row">
        <div class="form-field">
          <label>First Name</label>
          <input type="text" id="fname-${i}" placeholder="John" />
        </div>
        <div class="form-field">
          <label>Last Name</label>
          <input type="text" id="lname-${i}" placeholder="Doe" />
        </div>
      </div>
      <div class="form-row" style="margin-top:12px">
        <div class="form-field">
          <label>Age</label>
          <input type="number" id="age-${i}" placeholder="25" min="1" max="99" />
        </div>
        <div class="form-field">
          <label>Gender</label>
          <select id="gender-${i}">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

function updateTripSummary() {
  const bus = state.selectedBus;
  document.getElementById('sumBus').textContent   = bus.name;
  document.getElementById('sumRoute').textContent = `${state.from} → ${state.to}`;
  document.getElementById('sumDate').textContent  = formatDate(state.date);
  document.getElementById('sumSeats').textContent = state.selectedSeats.join(', ');
  document.getElementById('sumTotal').textContent = `$${bus.price * state.selectedSeats.length}`;
}

function confirmBooking() {
  // Validate passengers
  for (let i = 0; i < state.selectedSeats.length; i++) {
    const fn = document.getElementById(`fname-${i}`)?.value.trim();
    const ln = document.getElementById(`lname-${i}`)?.value.trim();
    const age = document.getElementById(`age-${i}`)?.value.trim();
    const gen = document.getElementById(`gender-${i}`)?.value;
    if (!fn || !ln) return toast(`Enter name for Passenger ${i+1}`);
    if (!age)       return toast(`Enter age for Passenger ${i+1}`);
    if (!gen)       return toast(`Select gender for Passenger ${i+1}`);
  }
  const email = document.getElementById('contactEmail').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  if (!email) return toast('Please enter email address');
  if (!phone) return toast('Please enter phone number');

  renderTicket();
  goTo(5);
}

// ─── STEP 5: TICKET ──────────────────────────────────────────────────────────
function renderTicket() {
  const bus = state.selectedBus;
  const pnr = 'BG' + Math.floor(100000 + Math.random() * 900000);

  document.getElementById('pnrNumber').textContent = `PNR: ${pnr}`;
  document.getElementById('ticketFrom').textContent = state.from.substring(0, 3).toUpperCase();
  document.getElementById('ticketTo').textContent   = state.to.substring(0, 3).toUpperCase();
  document.getElementById('ticketDep').textContent  = bus.dep;
  document.getElementById('ticketArr').textContent  = bus.arr;
  document.getElementById('ticketDate').textContent = formatDate(state.date);
  document.getElementById('ticketBus').textContent  = bus.name;
  document.getElementById('ticketSeats').textContent = state.selectedSeats.join(', ');
  document.getElementById('ticketPax').textContent  = state.selectedSeats.length;
  document.getElementById('ticketTotal').textContent = `$${bus.price * state.selectedSeats.length}`;
  document.getElementById('barcodeNum').textContent = pnr;

  generateBarcode();
}

function generateBarcode() {
  const container = document.getElementById('barcodeLines');
  const bars = Array.from({ length: 40 }, () => {
    const h = 15 + Math.random() * 25;
    return `<div class="bar" style="height:${h}px"></div>`;
  });
  container.innerHTML = bars.join('');
}

function printTicket() {
  window.print();
}

function bookAnother() {
  state = { from:'', to:'', date:'', passengers:1, selectedBus:null, selectedSeats:[], passengerDetails:[] };
  goTo(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
