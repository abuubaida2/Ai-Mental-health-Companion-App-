const API_BASE = 'http://192.168.1.6:8000'; // LAN IP - firewall now allows this

const COMMON_HEADERS = {
  'Bypass-Tunnel-Reminder': 'true',
  'User-Agent': 'MH-Companion-Mobile'
};

async function analyzeText(text){
  const res = await fetch(`${API_BASE}/analyze-text`,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      ...COMMON_HEADERS
    },
    body: JSON.stringify({text})
  });
  return res.json();
}

async function analyzeAudio(uri){
  const form = new FormData();
  const filename = uri.split('/').pop();
  // Detect MIME type from extension — iOS records .m4a, Android .3gp or .m4a
  const ext = filename.split('.').pop().toLowerCase();
  const mimeMap = { m4a: 'audio/m4a', aac: 'audio/aac', '3gp': 'audio/3gp', wav: 'audio/wav', mp4: 'audio/mp4' };
  const mimeType = mimeMap[ext] || 'audio/m4a';
  form.append('file', { uri, name: filename, type: mimeType });

  const res = await fetch(`${API_BASE}/analyze-audio`, {
    method: 'POST',
    headers: { ...COMMON_HEADERS },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

async function getHistory(){
  const res = await fetch(`${API_BASE}/mood-history`, {
    headers: {
      ...COMMON_HEADERS
    }
  });
  return res.json();
}

export default { analyzeText, analyzeAudio, getHistory };
