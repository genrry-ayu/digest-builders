// Digest transport v1.0.1: bounded full-body download, explicit proxy, diagnostics.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export async function fetchRemote(url, { json = false, proxy = 'http://127.0.0.1:15236', timeoutSeconds = 15, attempts = 2, delayMs = 1000, errors = [] } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const args = ['--silent', '--show-error', '--fail-with-body', '--location', '--max-time', String(timeoutSeconds), '--connect-timeout', String(Math.min(10, timeoutSeconds)), '--user-agent', 'follow-builders/1.0.1', '--max-filesize', '20971520'];
      // Do not depend on the shell's HTTP_PROXY / NO_PROXY settings.
      args.push('--proxy', proxy, '--noproxy', proxy ? '' : '*', url);
      const { stdout } = await exec('/usr/bin/curl', args, { timeout: timeoutSeconds * 1000 + 2000, maxBuffer: 24 * 1024 * 1024 });
      return json ? JSON.parse(stdout) : stdout;
    } catch (error) {
      const detail = error instanceof SyntaxError ? 'Invalid JSON response' : String(error.stderr || error.code || error.message).trim().slice(0, 500);
      errors.push(`Remote ${new URL(url).pathname} attempt ${attempt}/${attempts}: ${detail}`);
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return null;
}
