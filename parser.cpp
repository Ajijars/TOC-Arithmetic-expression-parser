#include <iostream>
#include <string>
#include <cctype>
#include <stdexcept>

using namespace std;

class ArithmeticParser {
private:
    string input;
    int pos;
    char current_char;

    // Move to the next character in the input string
    void advance() {
        pos++;
        if (pos < input.length()) {
            current_char = input[pos];
        } else {
            current_char = '\0'; // End of string
        }
    }

    // Skip any empty spaces
    void skip_whitespace() {
        while (current_char != '\0' && isspace(current_char)) {
            advance();
        }
    }

    // Match the expected character and advance, else throw an error
    void match(char expected) {
        skip_whitespace();
        if (current_char == expected) {
            advance();
        } else {
            throw runtime_error("Syntax Error");
        }
    }

    // F -> (E) | id
    void F() {
        skip_whitespace();
        if (current_char == '(') {
            match('(');
            E(); // Parse inner expression
            match(')');
        } else if (isalnum(current_char)) { // Check for variables like 'a', 'b', 'c' or numbers
            while (isalnum(current_char)) {
                advance();
            }
        } else {
            throw runtime_error("Syntax Error");
        }
    }

    // T -> F | T * F | T / F 
    // Handled iteratively to avoid left-recursion: T -> F { (*|/) F }
    void T() {
        F();
        skip_whitespace();
        while (current_char == '*' || current_char == '/') {
            if (current_char == '*') {
                match('*');
                F();
            } else if (current_char == '/') {
                match('/');
                F();
            }
            skip_whitespace();
        }
    }

    // E -> T | E + T | E - T
    // Handled iteratively to avoid left-recursion: E -> T { (+|-) T }
    void E() {
        T();
        skip_whitespace();
        while (current_char == '+' || current_char == '-') {
            if (current_char == '+') {
                match('+');
                T();
            } else if (current_char == '-') {
                match('-');
                T();
            }
            skip_whitespace();
        }
    }

public:
    ArithmeticParser(string text) {
        input = text;
        pos = 0;
        if (input.length() > 0) {
            current_char = input[pos];
        } else {
            current_char = '\0';
        }
    }

    // Starts the parsing process
    bool parse() {
        try {
            E(); // Start parsing from Expression E()
            skip_whitespace();
            
            // If we successfully parsed the expression and reached the end of the string, it's valid
            if (current_char != '\0') {
                return false; 
            }
            return true;
        } catch (const runtime_error& e) {
            return false; // Any syntax error means invalid expression
        }
    }
};

int main() {
    string expression;
    cout << "Input: ";
    getline(cin, expression);

    ArithmeticParser parser(expression);
    
    cout << "Output:" << endl;
    if (parser.parse()) {
        cout << "Valid Expression" << endl;
    } else {
        cout << "Invalid Expression" << endl;
    }

    return 0;
}
