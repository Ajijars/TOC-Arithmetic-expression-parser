// Frontend Controller & Bridge to parser.py

// Local Fallback Parser (in case Python server is not yet started)
class LocalArithmeticParser {
    constructor(text) {
        this.input = text;
        this.pos = 0;
        this.currentChar = text.length > 0 ? text[this.pos] : null;
        this.steps = [];
        this.errorMessage = null;
    }

    log(msg) { this.steps.push(msg); }

    advance() {
        this.pos++;
        this.currentChar = this.pos < this.input.length ? this.input[this.pos] : null;
    }

    skipWhitespace() {
        while (this.currentChar !== null && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }

    match(expected) {
        this.skipWhitespace();
        if (this.currentChar === expected) {
            this.log(`Matched terminal '${expected}'`);
            this.advance();
        } else {
            const found = this.currentChar ? `'${this.currentChar}'` : "End of Input";
            const err = `Syntax Error at position ${this.pos}: Expected '${expected}', found ${found}`;
            this.errorMessage = err;
            throw new Error(err);
        }
    }

    F() {
        this.skipWhitespace();
        this.log(`Entering F() with lookahead: '${this.currentChar}'`);
        if (this.currentChar === '(') {
            this.log("F -> ( E ) : Found '(', recursing into E()");
            this.match('(');
            this.E();
            this.match(')');
            this.log("F -> ( E ) : Successfully matched ')'");
        } else if (/[a-zA-Z0-9]/.test(this.currentChar)) {
            let token = "";
            while (this.currentChar !== null && /[a-zA-Z0-9]/.test(this.currentChar)) {
                token += this.currentChar;
                this.advance();
            }
            this.log(`F -> id : Parsed identifier/operand '${token}'`);
        } else {
            const found = this.currentChar ? `'${this.currentChar}'` : "End of Input";
            const err = `Syntax Error at position ${this.pos}: Expected identifier or '(', found ${found}`;
            this.errorMessage = err;
            throw new Error(err);
        }
    }

    T() {
        this.log("Entering T() [Term]");
        this.F();
        this.skipWhitespace();
        while (this.currentChar === '*' || this.currentChar === '/') {
            const op = this.currentChar;
            this.log(`T -> T ${op} F : Operator '${op}' detected`);
            this.match(op);
            this.F();
            this.skipWhitespace();
        }
    }

    E() {
        this.log("Entering E() [Expression]");
        this.T();
        this.skipWhitespace();
        while (this.currentChar === '+' || this.currentChar === '-') {
            const op = this.currentChar;
            this.log(`E -> E ${op} T : Operator '${op}' detected`);
            this.match(op);
            this.T();
            this.skipWhitespace();
        }
    }

    parse() {
        if (!this.input.trim()) {
            this.errorMessage = "Empty input expression";
            return false;
        }
        try {
            this.log(`--- Starting parsing of expression: "${this.input}" ---`);
            this.E();
            this.skipWhitespace();
            if (this.currentChar !== null) {
                this.errorMessage = `Syntax Error: Unconsumed character '${this.currentChar}' at position ${this.pos}`;
                this.log(this.errorMessage);
                return false;
            }
            this.log("Parsing succeeded: Input conforms to Context-Free Grammar!");
            return true;
        } catch (e) {
            if (!this.errorMessage) this.errorMessage = e.message;
            this.log(`Parsing failed: ${this.errorMessage}`);
            return false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const expressionInput = document.getElementById('expression');
    const parseBtn = document.getElementById('parseBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusDescription = document.getElementById('statusDescription');
    const backendStatusBadge = document.getElementById('backendStatusBadge');
    const executionSource = document.getElementById('executionSource');
    const traceLog = document.getElementById('traceLog');
    const stepCount = document.getElementById('stepCount');
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Base API URL: uses relative path if served via app.py, or falls back to localhost:5000 if opened from file://
    const API_URL = window.location.protocol.startsWith('http') 
        ? '/api/parse' 
        : 'http://localhost:5000/api/parse';

    let backendAvailable = false;

    // Check backend connection health
    async function checkBackend() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_URL}?expr=test`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                backendAvailable = true;
                backendStatusBadge.className = 'badge backend-badge';
                backendStatusBadge.innerHTML = '<span class="status-dot online"></span> Python Backend: parser.py (Connected)';
                return;
            }
        } catch (err) {
            // Server offline
        }
        backendAvailable = false;
        backendStatusBadge.className = 'badge backend-badge offline';
        backendStatusBadge.innerHTML = '<span class="status-dot offline"></span> Python: Standalone Mode (Run app.py)';
    }

    checkBackend();

    async function handleParse() {
        const expression = expressionInput.value;
        if (!expression.trim()) {
            expressionInput.focus();
            return;
        }

        let isValid = false;
        let steps = [];
        let errorMessage = null;
        let usedBackend = false;

        // 1. Try sending expression to Python backend (parser.py)
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: expression })
            });

            if (response.ok) {
                const data = await response.json();
                isValid = data.valid;
                steps = data.steps || [];
                errorMessage = data.error;
                usedBackend = true;
                backendAvailable = true;
                backendStatusBadge.className = 'badge backend-badge';
                backendStatusBadge.innerHTML = '<span class="status-dot online"></span> Python Backend: parser.py (Connected)';
            }
        } catch (e) {
            usedBackend = false;
        }

        // 2. If Python server wasn't reachable, run local fallback parser
        if (!usedBackend) {
            const localParser = new LocalArithmeticParser(expression);
            isValid = localParser.parse();
            steps = localParser.steps;
            errorMessage = localParser.errorMessage;
        }

        // 3. Render Results
        resultsContainer.classList.remove('hidden');

        statusIndicator.className = 'status-indicator ' + (isValid ? 'valid' : 'invalid');
        statusText.textContent = isValid ? 'Valid Expression' : 'Invalid Expression';
        statusDescription.textContent = isValid 
            ? 'Successfully derived from Start Symbol E using CFG production rules.' 
            : (errorMessage || 'Grammar rules violated; could not derive expression.');

        if (usedBackend) {
            executionSource.innerHTML = '⚡ Verified by Python backend (<strong>parser.py</strong> via <code>app.py</code>)';
        } else {
            executionSource.innerHTML = '⚡ Verified by client parser. (Tip: Run <code>python app.py</code> or <code>run.bat</code> for direct <strong>parser.py</strong> execution)';
        }

        // Render derivation steps
        renderTrace(steps);

        // Shake input if invalid
        if (!isValid) {
            expressionInput.classList.remove('shake');
            void expressionInput.offsetWidth;
            expressionInput.classList.add('shake');
        }
    }

    function renderTrace(steps) {
        traceLog.innerHTML = '';
        stepCount.textContent = `${steps.length} step${steps.length === 1 ? '' : 's'}`;

        steps.forEach((step) => {
            const div = document.createElement('div');
            div.className = 'trace-item';

            if (step.includes('->') || step.includes('Entering')) {
                div.classList.add('rule');
            } else if (step.includes('Matched') || step.includes('Parsed')) {
                div.classList.add('match');
            } else if (step.includes('Error') || step.includes('failed')) {
                div.classList.add('error');
            }

            div.textContent = step;
            traceLog.appendChild(div);
        });

        // Scroll to bottom of trace
        traceLog.scrollTop = traceLog.scrollHeight;
    }

    parseBtn.addEventListener('click', handleParse);

    expressionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleParse();
        }
    });

    // Preset buttons for one-click testing
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const expr = btn.getAttribute('data-expr');
            expressionInput.value = expr;
            handleParse();
        });
    });
});
