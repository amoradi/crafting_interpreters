/*

    An Interpreter for my homemade language, Cent.

    Reference: https://craftinginterpreters.com/scanning.html

    Currently in section: 4.5

    ///////////////////////////////////////////
    //////// TERMS ////////////////////////////

    lexemes: raw substrings of the source code

    tokens: lexemes, bundled with other data
      - token type
      - literanl value
      - location information

    lexical grammar: rules that determine how a particular language groups characters into lexemes
      - most programming languages, the rules of that grammar are simple enough
        for the language to be classified a regular language.
      - tools like Lex or Flex genereate scanners given regexes. Handy!

*/

enum TokenType {
    // Single-character tokens.
    LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,
  
    // One or two character tokens.
    BANG, BANG_EQUAL,
    EQUAL, EQUAL_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,
  
    // Literals.
    IDENTIFIER, STRING, NUMBER,
  
    // Keywords.
    AND, CLASS, ELSE, FALSE, FUN, FOR, IF, NIL, OR,
    PRINT, RETURN, SUPER, THIS, TRUE, VAR, WHILE,
  
    EOF
  }

interface Token {
    type: TokenType;
    lexeme: string;
    literal: object;
    line: number;
};

/*

    source code ---> lexeme ---> token ---> repeat from next source code position.

    The scanner works its way through the source code, adding tokens until it runs out of characters.
    Then it appends one final “end of file” token. 

*/
class Scanner {
    // tracks what source line current is on so we can produce tokens that know their location
    private line = 1;
    // points at the character currently being considered
    private current = 0;
    private source: string;
    // the first character in the lexeme being scanned
    private start = 0;
    private tokens: Token[];

    constructor(source: string) {
        this.source = source;
    }

    // Positional methods.
    advance(): string {
        return this.source.charAt(this.current++);
    }

    isAtEnd():boolean {
        return this.current >= this.source.length;
    }

    // Token methods.
    addToken(): void {

    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            // We are at the beginning of the next lexeme.
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(EOF, "", null, this.line));

        return this.tokens;
    }

    scanToken():void {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(LEFT_PAREN); break;
            case ')': this.addToken(RIGHT_PAREN); break;
            case '{': this.addToken(LEFT_BRACE); break;
            case '}': this.addToken(RIGHT_BRACE); break;
            case ',': this.addToken(COMMA); break;
            case '.': this.addToken(DOT); break;
            case '-': this.addToken(MINUS); break;
            case '+': this.addToken(PLUS); break;
            case ';': this.addToken(SEMICOLON); break;
            case '*': this.addToken(STAR); break;
            // 2-char lexemes: !, !=, ...
            case '!':
                this.addToken(this.match('=') ? BANG_EQUAL : BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? EQUAL_EQUAL : EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? LESS_EQUAL : LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? GREATER_EQUAL : GREATER);
                break;

            default:
            // Lox.error(line, "Unexpected character.");
            break;
        }
    }

    match(char, expected) {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) != expected) return false;

        this.current++;
        return true;
    }
}


// class ScannerJava {
//     private int start = 0;
//     private int current = 0;
//     private int line = 1;

//     private final String source;
//     private final List<Token> tokens = new ArrayList<>();

//     Scanner(String source) {
//     this.source = source;

//     private boolean isAtEnd() {
//         return current >= source.length();
//     }

//     List<Token> scanTokens() {
//         while (!isAtEnd()) {
//             // We are at the beginning of the next lexeme.
//             start = current;
//             scanToken();
//         }

//         tokens.add(new Token(EOF, "", null, line));
//         return tokens;
//     }

//     // In each turn of the loop, we scan a single token. This is the real heart of the scanner.
//     // We’ll start simple. Imagine if every lexeme were only a single character long.
//     // All you would need to do is consume the next character and pick a token type for it.
//     // Several lexemes are only a single character in Lox, so let’s start with those.
//     private void scanToken() {
//         char c = advance();
//         switch (c) {
//           case '(': addToken(LEFT_PAREN); break;
//           case ')': addToken(RIGHT_PAREN); break;
//           case '{': addToken(LEFT_BRACE); break;
//           case '}': addToken(RIGHT_BRACE); break;
//           case ',': addToken(COMMA); break;
//           case '.': addToken(DOT); break;
//           case '-': addToken(MINUS); break;
//           case '+': addToken(PLUS); break;
//           case ';': addToken(SEMICOLON); break;
//           case '*': addToken(STAR); break; 
//           default:
//             Lox.error(line, "Unexpected character.");
//             break;
//         }

//         // One-two punch lexemes: !, !=
//         case '!':
//             addToken(match('=') ? BANG_EQUAL : BANG);
//             break;
//           case '=':
//             addToken(match('=') ? EQUAL_EQUAL : EQUAL);
//             break;
//           case '<':
//             addToken(match('=') ? LESS_EQUAL : LESS);
//             break;
//           case '>':
//             addToken(match('=') ? GREATER_EQUAL : GREATER);
//             break;
//     }

//     private boolean match(char expected) {
//         if (isAtEnd()) return false;
//         if (source.charAt(current) != expected) return false;
    
//         current++;
//         return true;
//       }

//     // consumes the next character in the source file and returns it
//     private char advance() {
//         return source.charAt(current++);
//       }
    
//       // advance() is for input, addToken() is for output. It grabs the text of the current lexeme and creates a new token for it. 
//       private void addToken(TokenType type) {
//         addToken(type, null);
//       }
    
//       private void addToken(TokenType type, Object literal) {
//         String text = source.substring(start, current);
//         tokens.add(new Token(type, text, literal, line));
//       }

// }

    