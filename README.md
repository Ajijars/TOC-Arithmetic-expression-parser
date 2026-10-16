# Arithmetic Expression Parser using Context-Free Grammar (CFG)

> **TOC Case Study 14**  
> **Course:** Theory of Computation (PCCO301)  
> **Institution:** Sanjivani College of Engineering, Kopargaon  
> **Class:** TY Computer Engineering (Division B)  
> **Academic Year:** 2026–2027  
> **Guide:** Dr. N. G. Pardeshi  

## 👥 Group 14 Members
- **126** — Shaikh Ajij Rafik
- **128** — Naikwadi Sanika Sandip
- **129** — Lihinar Jyoti Shankar
- **130** — Kale Gautami Vijay

---

## 🚀 How to Run (One-Click Launch)

### Option 1: Double-Click `run.bat` (Recommended)
Simply double-click the **[`run.bat`](file:///c:/TOC_Activity/run.bat)** file. It will:
1. Start the Python server connected directly to `parser.py`.
2. Automatically open the Web Frontend in your default browser.
3. Every expression you test will be parsed by `parser.py` with real-time CFG derivation steps shown!

### Option 2: Run via Terminal
```bash
python app.py
```
This boots the backend and automatically pops open `http://localhost:5000` in your web browser.

### Option 3: Pure CLI Mode
```bash
python parser.py
```
Prompts for an expression in the terminal and outputs `Valid Expression` or `Invalid Expression`.

---

## 📂 Repository Contents
- **[`parser.py`](file:///c:/TOC_Activity/parser.py)**: Core Python implementation of the Recursive-Descent Parser for the CFG rules ($E$, $T$, $F$).
- **[`app.py`](file:///c:/TOC_Activity/app.py)**: Python bridge server using standard libraries (`http.server`, `socketserver`, `webbrowser`) with zero external dependencies.
- **[`run.bat`](file:///c:/TOC_Activity/run.bat)**: Windows batch script to launch the app with a single click.
- **[`index.html`](file:///c:/TOC_Activity/index.html)**: Interactive Frontend with live CFG trace viewer, sample presets, and status indicators.
- **[`style.css`](file:///c:/TOC_Activity/style.css)**: Modern glassmorphic dark-mode styling.
- **[`script.js`](file:///c:/TOC_Activity/script.js)**: Frontend controller that communicates with `parser.py`.
- **[`PARSER_EXPLANATION.md`](file:///c:/TOC_Activity/PARSER_EXPLANATION.md)**: Full academic project explanation covering CFG definitions, left-recursion elimination, and trace tables.
