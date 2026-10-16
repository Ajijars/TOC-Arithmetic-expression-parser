class ArithmeticParser:
    def __init__(self, text: str):
        self.input = text
        self.pos = 0
        self.current_char = text[0] if text else None
        self.steps = []
        self.error_message = None

    def log(self, message: str):
        """Record parsing step for visualization."""
        self.steps.append(message)

    def advance(self):
        """Move to the next character in the input string."""
        self.pos += 1
        if self.pos < len(self.input):
            self.current_char = self.input[self.pos]
        else:
            self.current_char = None  # End of string

    def skip_whitespace(self):
        """Skip any whitespace characters."""
        while self.current_char is not None and self.current_char.isspace():
            self.advance()

    def match(self, expected: str):
        """Match expected character and advance, else raise SyntaxError."""
        self.skip_whitespace()
        if self.current_char == expected:
            self.log(f"Matched terminal '{expected}'")
            self.advance()
        else:
            found = f"'{self.current_char}'" if self.current_char is not None else "End of Input"
            err = f"Syntax Error at position {self.pos}: Expected '{expected}', found {found}"
            self.error_message = err
            raise SyntaxError(err)

    def F(self):
        """F -> (E) | id"""
        self.skip_whitespace()
        self.log(f"Entering F() with lookahead: '{self.current_char}'")
        
        if self.current_char == '(':
            self.log("F -> ( E ) : Found '(', recursing into E()")
            self.match('(')
            self.E()  # Parse nested expression
            self.match(')')
            self.log("F -> ( E ) : Successfully matched ')'")
        elif self.current_char is not None and self.current_char.isalnum():
            # Consume identifier or number (e.g., 'a', 'b', '10')
            token = []
            while self.current_char is not None and self.current_char.isalnum():
                token.append(self.current_char)
                self.advance()
            val = "".join(token)
            self.log(f"F -> id : Parsed identifier/operand '{val}'")
        else:
            found = f"'{self.current_char}'" if self.current_char is not None else "End of Input"
            err = f"Syntax Error at position {self.pos}: Expected identifier or '(', found {found}"
            self.error_message = err
            raise SyntaxError(err)

    def T(self):
        """
        T -> F | T * F | T / F
        Handled iteratively to avoid left-recursion: T -> F { (*|/) F }
        """
        self.log("Entering T() [Term]")
        self.F()
        self.skip_whitespace()
        while self.current_char in ('*', '/'):
            op = self.current_char
            self.log(f"T -> T {op} F : Operator '{op}' detected")
            self.match(op)
            self.F()
            self.skip_whitespace()

    def E(self):
        """
        E -> T | E + T | E - T
        Handled iteratively to avoid left-recursion: E -> T { (+|-) T }
        """
        self.log("Entering E() [Expression]")
        self.T()
        self.skip_whitespace()
        while self.current_char in ('+', '-'):
            op = self.current_char
            self.log(f"E -> E {op} T : Operator '{op}' detected")
            self.match(op)
            self.T()
            self.skip_whitespace()

    def parse(self) -> bool:
        """Starts parsing. Returns True if valid, False otherwise."""
        if not self.input.strip():
            self.error_message = "Empty input string"
            return False
            
        try:
            self.log(f"--- Starting parsing of expression: \"{self.input}\" ---")
            self.E()
            self.skip_whitespace()
            if self.current_char is not None:
                self.error_message = f"Syntax Error: Unconsumed trailing character '{self.current_char}' at position {self.pos}"
                self.log(self.error_message)
                return False
            self.log("Parsing succeeded: Input conforms to Context-Free Grammar!")
            return True
        except SyntaxError as e:
            if not self.error_message:
                self.error_message = str(e)
            self.log(f"Parsing failed: {self.error_message}")
            return False


def main():
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--web":
        import app
        app.start_server()
        return

    expression = input("Input: ")
    parser = ArithmeticParser(expression)
    
    print("Output:")
    if parser.parse():
        print("Valid Expression")
    else:
        print("Invalid Expression")


if __name__ == "__main__":
    main()
