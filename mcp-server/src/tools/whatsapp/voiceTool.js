import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const WA_API = `https://graph.facebook.com/v18.0`;
const HEADERS = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };

/**
 * Download and transcribe a WhatsApp voice note.
 * Uses local Whisper (free, CPU). Falls back gracefully if not installed.
 *
 * Install transcription engine (one-time):
 *   pip install openai-whisper
 */
export async function whatsappTranscribeVoice({ mediaId, customerId }) {
  // Step 1: Get media URL from Meta
  const urlRes = await axios.get(`${WA_API}/${mediaId}`, { headers: HEADERS });
  const mediaUrl = urlRes.data.url;

  // Step 2: Download the audio
  const audioRes = await axios.get(mediaUrl, {
    headers: HEADERS,
    responseType: 'arraybuffer'
  });

  // Use OS temp dir (cross-platform: /tmp on Linux/Mac, %TEMP% on Windows)
  const tmpDir  = process.env.TEMP || process.env.TMP || '/tmp';
  const tmpFile = `${tmpDir}/voice_${mediaId}.ogg`;
  fs.writeFileSync(tmpFile, audioRes.data);

  // Step 3: Transcribe with local whisper
  let transcript = '';
  try {
    await execAsync(
      `whisper "${tmpFile}" --model tiny --output_format txt --output_dir "${tmpDir}"`
    );
    const txtFile = tmpFile.replace('.ogg', '.txt');
    if (fs.existsSync(txtFile)) {
      transcript = fs.readFileSync(txtFile, 'utf-8').trim();
      fs.unlinkSync(txtFile);
    }
    fs.unlinkSync(tmpFile);
  } catch (err) {
    // Graceful fallback if whisper not installed
    console.warn('[MCP] Whisper not found, returning placeholder:', err.message);
    transcript = '[Voice note received — manual transcription required]';
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }

  return { mediaId, transcript, customerId };
}
