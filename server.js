const express = require('express');
const cors = require('cors');
const adb = require('adbkit');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root fallback in case static middleware can't resolve __dirname
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ADB client — connects directly to a TCP device (no local adb daemon needed for key sending)
const client = adb.createClient();

let tvHost = null;
let tvPort = 5555;

// Key mappings
const KEYS = {
  // D-pad
  up:       'KEYCODE_DPAD_UP',
  down:     'KEYCODE_DPAD_DOWN',
  left:     'KEYCODE_DPAD_LEFT',
  right:    'KEYCODE_DPAD_RIGHT',
  center:   'KEYCODE_DPAD_CENTER',
  // System
  back:     'KEYCODE_BACK',
  home:     'KEYCODE_HOME',
  menu:     'KEYCODE_MENU',
  power:    'KEYCODE_POWER',
  // Volume
  vol_up:   'KEYCODE_VOLUME_UP',
  vol_down: 'KEYCODE_VOLUME_DOWN',
  mute:     'KEYCODE_VOLUME_MUTE',
  // Media
  play_pause: 'KEYCODE_MEDIA_PLAY_PAUSE',
  play:     'KEYCODE_MEDIA_PLAY',
  pause:    'KEYCODE_MEDIA_PAUSE',
  stop:     'KEYCODE_MEDIA_STOP',
  next:     'KEYCODE_MEDIA_NEXT',
  prev:     'KEYCODE_MEDIA_PREVIOUS',
  rewind:   'KEYCODE_MEDIA_REWIND',
  fast_fwd: 'KEYCODE_MEDIA_FAST_FORWARD',
};

// App package names
const APPS = {
  netflix:  'com.netflix.ninja',
  youtube:  'com.google.android.youtube.tv',
  prime:    'com.amazon.amazonvideo.livingroom',
  disney:   'com.disney.disneyplus',
  spotify:  'com.spotify.tv.android',
  plex:     'com.plexapp.android',
  settings: 'com.android.tv.settings',
};

function getDeviceId() {
  if (!tvHost) throw new Error('TV not connected');
  return `${tvHost}:${tvPort}`;
}

// Connect to TV
app.post('/api/connect', async (req, res) => {
  const { host, port } = req.body;
  if (!host) return res.status(400).json({ error: 'Host required' });

  tvHost = host;
  tvPort = port || 5555;

  try {
    await client.connect(tvHost, tvPort);
    // Quick test — list devices
    const devices = await client.listDevices();
    const found = devices.find(d => d.id === getDeviceId());
    if (!found) {
      return res.status(400).json({
        error: 'Device not found after connect. Make sure ADB debugging is enabled on your TV.',
      });
    }
    res.json({ ok: true, device: found.id, type: found.type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status
app.get('/api/status', async (req, res) => {
  try {
    const devices = await client.listDevices();
    if (!tvHost) return res.json({ connected: false });
    const found = devices.find(d => d.id === getDeviceId());
    res.json({ connected: !!found, device: found?.id, type: found?.type });
  } catch {
    res.json({ connected: false });
  }
});

// Send key
app.post('/api/key', async (req, res) => {
  const { key } = req.body;
  const keycode = KEYS[key];
  if (!keycode) return res.status(400).json({ error: `Unknown key: ${key}` });

  try {
    const deviceId = getDeviceId();
    await client.shell(deviceId, `input keyevent ${keycode}`);
    res.json({ ok: true, sent: keycode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch app
app.post('/api/app', async (req, res) => {
  const { app: appKey, package: pkg } = req.body;
  const packageName = pkg || APPS[appKey];
  if (!packageName) return res.status(400).json({ error: `Unknown app: ${appKey}` });

  try {
    const deviceId = getDeviceId();
    await client.shell(deviceId, `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
    res.json({ ok: true, launched: packageName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shell command (power users)
app.post('/api/shell', async (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).json({ error: 'cmd required' });
  try {
    const stream = await client.shell(getDeviceId(), cmd);
    const output = await adb.util.readAll(stream);
    res.json({ ok: true, output: output.toString().trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎮 Android TV Remote running at http://localhost:${PORT}\n`);
});