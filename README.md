# 🎮 Android TV Remote (Web App)

A browser-based remote control for your Android TV, powered by ADB over TCP.

## Prerequisites

1. **Node.js** (v16+) installed on your computer
2. **ADB debugging enabled** on your Android TV:
   - Go to **Settings → Device Preferences → About → Build** (tap 7× to unlock developer mode)
   - Then **Settings → Device Preferences → Developer Options → USB debugging → ON**
   - Also enable **Network debugging** (ADB over Wi-Fi) if you see it

## Setup

```bash
# Install dependencies
npm install

# Start the server
node server.js
```

Then open **http://localhost:3000** in your browser.

## Connecting

1. Find your TV's IP address: **Settings → Network → Status** (or check your router)
2. Enter the IP in the web app and click **Connect**
3. On first connect your TV may show a pairing prompt — accept it

> **Tip:** If connection fails, try running `adb connect <tv-ip>:5555` in a terminal first to pair, then use the web app.

## Features

| Section | Controls |
|---------|----------|
| System  | Power, Home, Back |
| D-pad   | Up/Down/Left/Right + OK |
| Volume  | Vol Up, Vol Down |
| Media   | Previous, Rewind, Play/Pause, Fast-Forward, Next |
| Apps    | Netflix, YouTube, Prime, Disney+, Spotify, Settings |
| Keyboard | Type text directly into any text field on the TV |

## Keyboard Shortcuts (browser)

| Key | Action |
|-----|--------|
| Arrow keys | D-pad |
| Enter | OK / Select |
| Backspace | Back |
| Space | Play/Pause |
| `+` / `-` | Volume up/down |

## Adding Custom Apps

Edit `server.js` → `APPS` object, add:
```js
myapp: 'com.example.myapp',
```
Then add a button in `public/index.html`.

## Troubleshooting

- **"Device not found"** — Make sure ADB debugging + Network debugging are ON on the TV
- **Pairing required** — On Android TV 11+, you may need to use ADB pair first:  
  `adb pair <tv-ip>:<pairing-port>` (port shown under Developer Options → Wireless debugging)
- **Firewall** — Ensure port 5555 is reachable on your local network

## Architecture

```
Browser (index.html)
   ↕  HTTP (REST)
Node.js server (server.js)  :3000
   ↕  ADB TCP
Android TV  :5555
```
