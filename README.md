# ParkEase – Smart Parking Slot Booking System

A beginner-friendly full-stack project built using **HTML, CSS, JavaScript, Node.js and Express.js**. It lets users view parking spaces, select an available slot, make a reservation, view current bookings and cancel a booking.

## Features

- View 16 parking slots across two floors.
- Filter parking spaces by floor.
- See available and booked slots.
- Book a slot with name, vehicle number, date and time.
- Prevent a slot from being booked twice while it has an active booking.
- View and cancel bookings.
- Store data in `data/parking.json` on the server.

## Requirements

- Node.js 18 or later
- npm (installed with Node.js)
- Git (for GitHub)

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open the terminal in the project folder.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open this address in your browser:

   `http://localhost:3000`

For development with automatic server restart (Node.js 18.11+):

```bash
npm run dev
```

## Project structure

```text
smart-parking-slot-booking/
├── data/
│   └── parking.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/slots` | Get all slots and their current status |
| GET | `/api/bookings` | Get all active bookings |
| POST | `/api/bookings` | Create a booking |
| DELETE | `/api/bookings/:id` | Cancel a booking |

Example POST body:

```json
{
  "slotId": "A01",
  "customerName": "Sekhar",
  "vehicleNumber": "KA01AB1234",
  "date": "2026-11-02",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

## Important project note

This is an educational demonstration. It stores bookings in a local JSON file and treats a slot as booked until the booking is cancelled. It does not yet implement payment, user accounts, time-overlap scheduling, production-grade database storage or concurrent booking protection. For a deployed multi-user application, use a database and transactional booking logic.

## Push to GitHub

Create an empty repository on GitHub, then run these commands from this project folder (replace the URL with your own repository URL):

```bash
git init
git add .
git commit -m "Initial commit - Smart Parking Slot Booking System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/smart-parking-slot-booking.git
git push -u origin main
```

If Git says the remote already exists, use:

```bash
git remote set-url origin https://github.com/YOUR-USERNAME/smart-parking-slot-booking.git
git push -u origin main
```
