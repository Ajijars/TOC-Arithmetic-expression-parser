# Case Study 14: Arithmetic Expression Parser using Context-Free Grammar (CFG)

**Department of Computer Engineering**  
**Sanjivani College of Engineering, Kopargaon**  
**Subject:** Theory of Computation (PCCO301) | **Class:** TY Computer (Division B)  
**Academic Year:** 2026–2027  

**Guided By:** Dr. N. G. Pardeshi  
**Group ID:** 14  
**Group Members:**
- Roll No. 126 — Shaikh Ajij Rafik
- Roll No. 128 — Naikwadi Sanika Sandip
- Roll No. 129 — Lihinar Jyoti Shankar
- Roll No. 130 — Kale Gautami Vijay

---

## 1. Introduction & Theoretical Foundation

In compiler design, **Syntax Analysis (Parsing)** is the phase that verifies whether a sequence of tokens provided by the lexical analyzer conforms to the grammatical rules of the programming language.

### Context-Free Grammar (CFG)
A Context-Free Grammar is formally defined as a 4-tuple:
$$G = (V, \Sigma, R, S)$$
- **$V$ (Non-terminals):** $\{E, T, F\}$
- **$\Sigma$ (Terminals):** $\{+, -, *, /, (, ), id\}$
- **$R$ (Production Rules):**
  1. $E \to E + T \mid E - T \mid T$
  2. $T \to T * F \mid T / F \mid F$
  3. $F \to (E) \mid id$
- **$S$ (Start Symbol):** $E$

### Operator Precedence & Associativity
- **Precedence Hierarchy:**
  1. Parentheses `( )` (Highest priority, evaluated in factor $F$)
  2. Multiplication `*` and Division `/` (Intermediate priority, evaluated in term $T$)
  3. Addition `+` and Subtraction `-` (Lowest priority, evaluated in expression $E$)
- **Associativity:** Left-to-right associativity is enforced by expanding terms from left to right.

### Eliminating Left Recursion
Top-down parsers like Recursive-Descent cannot directly handle left-recursive rules (e.g., $E \to E + T$) because it causes infinite recursion. The grammar is converted into an equivalent Extended Backus-Naur Form (EBNF) / iterative equivalent:
- $E \to T \; \{ (+ \mid -) \; T \}$
- $T \to F \; \{ (* \mid /) \; F \}$
- $F \to (E) \mid id$

---

## 2. Code Structure & Line-by-Line Explanation (`parser.py`)

The parser is implemented in Python using an object-oriented Recursive-Descent technique.

```
          [ ArithmeticParser ]
                   |
     +-------------+-------------+
     |                           |
[Lexer Helpers]          [Grammar Functions]
- advance()              - E() : Expression (+, -)
- skip_whitespace()      - T() : Term (*, /)
- match()                - F() : Factor (id, (E))
```

---

### A. State Variables & Class Initialization

```python
class ArithmeticParser:
    def __init__(self, text: str):
        self.input = text
        self.pos = 0
        self.current_char = text[0] if text else None
```
- **`self.input`**: Stores the raw input arithmetic string (e.g., `"a + b * c"`).
- **`self.pos`**: Pointer index indicating the current reading position in the string.
- **`self.current_char`**: Holds the character currently being inspected (lookahead symbol), or `None` if empty.

---

### B. Helper & Utility Methods

#### 1. `advance()`
```python
def advance(self):
    self.pos += 1
    if self.pos < len(self.input):
        self.current_char = self.input[self.pos]
    else:
        self.current_char = None  # End of string
```
- Increments `pos` by 1.
- Loads the next character into `current_char`.
- If the cursor moves past the end of the string, it sets `current_char = None` to indicate EOF (End of Input).

#### 2. `skip_whitespace()`
```python
def skip_whitespace(self):
    while self.current_char is not None and self.current_char.isspace():
        self.advance()
```
- Arithmetic expressions frequently contain spaces (e.g., `a + b`).
- This method skips tabs and spaces so only semantic tokens are evaluated.

#### 3. `match(expected)`
```python
def match(self, expected: str):
    self.skip_whitespace()
    if self.current_char == expected:
        self.advance()
    else:
        raise SyntaxError("Invalid Syntax")
```
- Compares `current_char` against the `expected` terminal character (such as `'+'`, `'*'`, `'('`, `')'`).
- If matched, it consumes the character by calling `advance()`.
- If it does not match, a `SyntaxError` is raised immediately.

---

### C. Grammar Production Functions

#### 1. Factor: `F()`
Corresponds to rule: **$F \to (E) \mid id$**

```python
def F(self):
    self.skip_whitespace()
    if self.current_char == '(':
        self.match('(')
        self.E()  # Parse nested expression
        self.match(')')
    elif self.current_char is not None and self.current_char.isalnum():
        # Consume identifier or number (e.g., 'a', 'b', '10')
        while self.current_char is not None and self.current_char.isalnum():
            self.advance()
    else:
        raise SyntaxError("Invalid Factor")
```
- **Nested Expression:** If `current_char == '('`:
  - Consumes `'('`.
  - Recursively calls `E()` to parse the entire expression inside parentheses.
  - Matches closing `')'`.
- **Identifier / Number ($id$):** If `current_char` is alphanumeric (`a-z`, `A-Z`, `0-9`), it reads the entire variable name or numeric literal.
- **Error:** If neither an identifier nor a `'('` is encountered (e.g., finding `*` where an operand is expected), an exception is raised.



#### 2. Term: `T()`
Corresponds to rule: **$T \to T * F \mid T / F \mid F$**  
Implemented as: **$T \to F \; \{ (* \mid /) \; F \}$**

```python
def T(self):
    self.F()
    self.skip_whitespace()
    while self.current_char in ('*', '/'):
        op = self.current_char
        self.match(op)
        self.F()
        self.skip_whitespace()
```
- First calls `F()` to parse the primary factor.
- Enters a loop as long as the current operator is `*` or `/`.
- Consumes the operator and parses the subsequent factor `F()`.
- Because `T()` is called inside `E()`, multiplication and division take higher precedence over addition and subtraction.

---

#### 3. Expression: `E()`
Corresponds to rule: **$E \to E + T \mid E - T \mid T$**  
Implemented as: **$E \to T \; \{ (+ \mid -) \; T \}$**

```python
def E(self):
    self.T()
    self.skip_whitespace()
    while self.current_char in ('+', '-'):
        op = self.current_char
        self.match(op)
        self.T()
        self.skip_whitespace()
```
- First calls `T()` to parse the first term.
- Continues in a loop as long as `+` or `-` is seen.
- Consumes the operator and calls `T()` for the right operand.
- This enforces left-to-right associativity for addition and subtraction.

---

### D. Main Parsing Controller: `parse()`

```python
def parse(self) -> bool:
    if not self.input.strip():
        return False
    try:
        self.E()
        self.skip_whitespace()
        # If there are leftover characters, expression is invalid
        return self.current_char is None
    except SyntaxError:
        return False
```
- Starts at the start symbol $E$ by invoking `self.E()`.
- Checks if the entire input has been consumed (`self.current_char is None`).
- Catches any `SyntaxError` raised during the recursive descent and returns `False`.
- Returns `True` only when the complete string satisfies the grammar rules.

---

### E. Driver Function: `main()`

```python
def main():
    expression = input("Input: ")
    parser = ArithmeticParser(expression)
    
    print("Output:")
    if parser.parse():
        print("Valid Expression")
    else:
        print("Invalid Expression")


if __name__ == "__main__":
    main()
```
- Takes user input from the terminal.
- Creates an instance of `ArithmeticParser`.
- Prints `"Valid Expression"` or `"Invalid Expression"`.

---

## 3. Execution Traces of Test Cases

### Example 1: `a + b * c` (Valid)
1. `parse()` calls `E()`.
2. `E()` calls `T()`.
3. `T()` calls `F()`.
4. `F()` consumes `'a'`. Lookahead is `'+'`.
5. `T()` completes because `'+'` is not `*` or `/`.
6. `E()` matches `'+'`, then calls `T()` for the right side.
7. `T()` calls `F()`, which consumes `'b'`. Lookahead is `'*'`.
8. `T()` matches `'*'`, then calls `F()`.
9. `F()` consumes `'c'`.
10. Input reaches `None` (end of string).
**Result:** **Valid Expression** ✅

---

### Example 2: `(a + b) * c` (Valid)
1. `E()` $\to$ `T()` $\to$ `F()`.
2. `F()` matches `'('` and recursively calls `E()`.
3. Inner `E()` parses `a + b`.
4. `F()` matches closing `')'`.
5. `T()` matches `'*'` and calls `F()`, which parses `'c'`.
6. Input reaches `None`.
**Result:** **Valid Expression** ✅

---

### Example 3: `a + * b` (Invalid)
    1. `E()` calls `T()`, parsing factor `'a'`.
2. `E()` matches `'+'`. Next call is `T()`.
3. `T()` calls `F()`.
4. `F()` expects an identifier or `'('`, but sees `'*'`.
5. `SyntaxError` raised $\to$ caught by `parse()`.
**Result:** **Invalid Expression** ❌

---

## 4. How to Run

### Command Line
```bash
python parser.py
```

### Interactive Web UI
Open [`index.html`](file:///c:/TOC_Activity/index.html) in your browser to test expressions interactively with real-time visual animations.
