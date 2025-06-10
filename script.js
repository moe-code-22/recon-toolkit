document.addEventListener('DOMContentLoaded', function() {

    // --- MATRIX & TYPEWRITER EFFECTS ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const alphabet = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = [];
    for (let x = 0; x < columns; x++) { rainDrops[x] = 1; }
    const drawMatrix = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
            if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) { rainDrops[i] = 0; }
            rainDrops[i]++;
        }
    };
    setInterval(drawMatrix, 33);
    const titleElement = document.getElementById('main-title');
    const titleText = "[SYSTEM::LOG]: Recon Toolkit"; // Shortened Title
    let i = 0;
    function typeWriter() {
        if (i < titleText.length) {
            titleElement.innerHTML += titleText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }
    typeWriter();

    // --- INTERACTIVE TERMINAL LOGIC ---
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');

    terminalInput.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                printToTerminal(`> ${command}`, 'terminal-command');
                await processCommand(command);
                terminalInput.value = '';
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        }
    });

    function printToTerminal(text, className = 'terminal-response') {
        const p = document.createElement('p');
        p.className = className;
        p.innerHTML = text;
        terminalOutput.appendChild(p);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // --- MAIN COMMAND PROCESSOR ---
    async function processCommand(command) {
        const [cmd, ...args] = command.split(' ');
        let target = args[0];

        if (target && target.includes('://')) {
            try {
                target = new URL(target).hostname;
            } catch (error) {
                printToTerminal(`Error: Invalid URL format: ${target}`, 'terminal-error');
                return;
            }
        }

        switch (cmd.toLowerCase()) {
            case 'help':
                printToTerminal(
                    '<b>Available commands:</b>\n' +
                    '  <b>help</b>              - Show this list\n' +
                    '  <b>scan [domain] [type]</b>- DNS lookup (types: A, AAAA, MX, TXT, NS)\n' +
                    '  <b>ping [domain]</b>       - Measure response time and resolve IP\n' +
                    '  <b>subscan [domain]</b>    - Find subdomains of a target\n' +
                    '  <b>headers [domain]</b>    - Get HTTP headers from a website (like `curl -I`)\n' +
                    '  <b>sysinfo</b>           - Display terminal system info\n' +
                    '  <b>whoami</b>            - Display a unique session ID\n' +
                    '  <b>clear</b>             - Clear terminal screen'
                );
                break;
            case 'whoami':
                // Generate a random UUID for the user session
                printToTerminal(`user: ${crypto.randomUUID()}`);
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case 'sysinfo':
                printToTerminal(
                    '<b>[System Information]</b>\n' +
                    '  <b>Toolkit Ver:</b>      8.0 (Final)\n' +
                    '  <b>Kernel:</b>         5.6-ghost (Browser Emulation)\n' +
                    '  <b>Protocol:</b>       HTTP/S via Public APIs\n' +
                    '  <b>Status:</b>         All systems nominal.'
                );
                break;
            case 'scan':
                if (!target) { printToTerminal('Error: Missing target. Usage: scan [domain] [type]', 'terminal-error'); return; }
                const recordType = args[1] || 'A';
                printToTerminal(`[+] Performing DNS lookup for ${target} (Type: ${recordType.toUpperCase()})...`);
                const dnsResult = await cloudflareApiScan(target, recordType);
                printToTerminal(dnsResult);
                break;
            case 'ping':
                if (!target) { printToTerminal('Error: Missing target. Usage: ping [domain]', 'terminal-error'); return; }
                const answers = await resolveDns(target, 'A');
                const ipAddress = answers ? answers[0].data : null;
                await imagePing(target, ipAddress);
                break;
            case 'subscan':
                if (!target) { printToTerminal('Error: Missing target. Usage: subscan [domain]', 'terminal-error'); return; }
                printToTerminal(`[+] Scanning for subdomains of ${target}...`);
                const subResult = await hackertargetSubscan(target);
                printToTerminal(subResult);
                break;
            case 'headers':
                 if (!target) { printToTerminal('Error: Missing target. Usage: headers [domain]', 'terminal-error'); return; }
                printToTerminal(`[+] Fetching HTTP headers for ${target}...`);
                const headersResult = await hackerTargetHeaders(target);
                printToTerminal(headersResult);
                break;
            default:
                printToTerminal(`Command not found: ${cmd}`, 'terminal-error');
        }
    }
    
    window.runCommandFromLink = function(event, command) {
        event.preventDefault();
        terminalInput.value = command;
        terminalInput.focus();
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        terminalInput.dispatchEvent(enterEvent);
    }
    
    // --- CORE TOOL: DNS Resolver ---
    async function resolveDns(target, type) {
        try {
            const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${target}&type=${type}`, { headers: { 'accept': 'application/dns-json' } });
            if (!response.ok) return null;
            const data = await response.json();
            return (data.Status === 0 && data.Answer) ? data.Answer : null;
        } catch (error) { return null; }
    }

    // --- TOOL: DNS SCAN (Uses the core resolver) ---
    async function cloudflareApiScan(target, type) {
        const answers = await resolveDns(target, type);
        if (!answers) { return `[ERROR] DNS Scan failed: Domain not found or no records exist for that type.`; }
        let report = `<b>${type.toUpperCase()} Records for ${target}:</b>\n`;
        answers.forEach(record => { report += `  - ${record.data}\n`; });
        return report;
    }

    // --- TOOL: AUTHENTIC PING (Uses the core resolver) ---
    async function imagePing(target, ipAddress) {
        const pingHeader = ipAddress ? `Pinging ${target} [${ipAddress}] with 32 bytes of data:` : `Pinging ${target} with 32 bytes of data: (IP resolution failed)`;
        printToTerminal(pingHeader);
        for (let i = 0; i < 4; i++) {
            await new Promise(resolve => {
                const img = new Image();
                const startTime = Date.now();
                const handler = () => {
                    const latency = Date.now() - startTime;
                    const replyIp = ipAddress || target;
                    printToTerminal(`  Reply from ${replyIp}: time=${latency}ms`);
                    resolve();
                };
                img.onload = handler;
                img.onerror = handler;
                img.src = `https://${target}/favicon.ico?t=${Date.now()}`;
            });
            await new Promise(res => setTimeout(res, 500));
        }
    }

    // --- TOOL: SUBDOMAIN SCAN (HackerTarget API) ---
    async function hackertargetSubscan(target) {
        try {
            const response = await fetch(`https://api.hackertarget.com/hostsearch/?q=${target}`);
            if (!response.ok) throw new Error(`API returned status ${response.status}.`);
            const text = await response.text();
            if (text.includes('error check your search query')) throw new Error('Invalid query or no subdomains found.');
            return `<b>Subdomains Found:</b>\n${text}`;
        } catch (error) { return `[ERROR] Subdomain scan failed: ${error.message}`; }
    }

    // --- TOOL: HTTP HEADERS (HackerTarget API - like `curl -I`) ---
    async function hackerTargetHeaders(target) {
        try {
            const response = await fetch(`https://api.hackertarget.com/httpheaders/?q=${target}`);
            if (!response.ok) throw new Error(`API returned status ${response.status}.`);
            const text = await response.text();
            if (text.includes('error check your search query')) throw new Error('Invalid query.');
            const sanitizedText = text.replace(/</g, "<").replace(/>/g, ">");
            return `<b>Response Headers from ${target}:</b>\n${sanitizedText}`;
        } catch (error) { return `[ERROR] Header fetch failed: ${error.message}`; }
    }

    // --- UTILITY: Window Resize Listener ---
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});