/*

    An Interpreter for my homemade language, Penny.

    Reference: https://craftinginterpreters.com/scanning.html

    Currently in section: 5.1.2

    ///////////////////////////////////////////
    //////// TERMS ////////////////////////////

    lexemes: raw substrings of the source code

    tokens: lexemes, bundled with other data
      - token type
      - literal value
      - location information

    lexical grammar: rules that determine how a particular language groups characters into lexemes
      - in most programming languages, the rules of that grammar are simple enough
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

    // End of file
    EOF
}

interface Token {
    type: TokenType;
    lexeme: string;
    literal: string | number | null;
    line: number;
};

function tokenFactory(
    type,
    lexeme,
    literal,
    line
    ): Token {
        return {
            type,
            lexeme,
            literal,
            line
        }
}

// An MVP class so that error handling repsonsibilities don't
// get munged into the interpreter -- keep a line of separation.
class ErrorHandler {
    private errors: string[];

    // TODO: Add line number.
    add(error: string): void {
        this.errors.push(error);
    }

    print(): void {
        console.log(this.errors)
    }
}

/*

    source code ---> lexeme ---> token ---> repeat from next source code position.

    The scanner works its way through the source code, adding tokens until it runs out of characters.
    Then it appends one final "end of file" token. 

*/
class Scanner {
    private errorHandler: ErrorHandler;

    // tracks what source line current is on so we can produce tokens that know their location
    private line = 1;
    // points at the character currently being considered
    private current = 0;
    private source: string;
    // the first character in the lexeme being scanned
    private start = 0;

    // Store all relevant tokens here.
    // Not included: comments, white-space, new lines, etc.
    private tokens: Token[];

    constructor(source: string) {
        this.source = source;
        this.errorHandler = new ErrorHandler();
    }

    keywords = {
       "and":    TokenType.AND,
       "class":  TokenType.CLASS,
       "else":   TokenType.ELSE,
       "false":  TokenType.FALSE,
       "for":    TokenType.FOR,
       "fun":    TokenType.FUN,
       "if":     TokenType.IF,
       "nil":    TokenType.NIL,
       "or":     TokenType.OR,
       "print":  TokenType.PRINT,
       "return": TokenType.RETURN,
       "super":  TokenType.SUPER,
       "this":   TokenType.THIS,
       "true":   TokenType.TRUE,
       "var":    TokenType.VAR,
       "while":  TokenType.WHILE,
    }

    // Positional methods
    advance(): string {
        return this.source.charAt(this.current++);
    }

    isAtEnd():boolean {
        return this.current >= this.source.length;
    }

    // Token methods
    addToken(type: TokenType) {
        this.addTokenLiteral(type, null);
    }

    addTokenLiteral(type: TokenType, literal: string | number | null) {
        const text = this.source.substring(this.start, this.current);
        const token = {
            type,
            lexeme: text, // w/quotes
            literal, // w/o quotes
            line: this.line
        };

        this.tokens.push(token)
    }

    // Lookahead
    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        // Add end of file token
        this.tokens.push(tokenFactory(TokenType.EOF, "", null, this.line));

        return this.tokens;
    }

    // This is where all the action happens.
    scanToken(): void {
        const c = this.advance();
        switch (c) {
            //////////////////
            /// 1-char lexemes
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;

            //////////////////////////////
            /// 2-char lexemes: !, !=, ...
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '/':
                if (this.match('/')) {
                    ////////////////////////////////////
                    /// Comments, i.e. whole line lexeme
                    //  ignored.
                    //
                    // A comment goes until the end of the line.
                    while (this.peek() !== '\n' && !this.isAtEnd()) {
                        this.advance();
                    }

                    // Done scanning the comment, then do nothing with it.
                    // We just need to know when the next lexeme starts,
                    // and don't really care about the comment or its contents.

                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;

            ///////////////////////////
            /// Whitespace - ignore it.
            case ' ':
            case '\r':
            case '\t':
                break;

            ///////////////////////////////////////
            /// New line - ignore and increment it.
            case '\n':
                this.line++;
                break;

            ///////////////////
            /// String literals
            case '"': 
                this.scanStringLiteral();
                break;

            ///////////////////
            /// Number literals
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this.scanNumberLiteral();
                break;

            default:

            ////////////////////////////////
            /// Reserved words & identifiers
            //
            // We've it this far without breaking out,
            // if you're an alpha char at this point, you are a revserved word or identifier.
            if (this.isAlpha(c)) {
                this.identifier();
            }
          

            ///////////////////////////////////
            /// Error case, no char match found
            //
            // Delegate to the ErrorHandler, and scan on to the next lexeme.
            // (Accumulate errors through the scanning process, don't interupt the scan.)
            this.errorHandler.add("Unexpected character.")
            break;
        }
    }

    match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current++;
        return true;
    }

    scanStringLiteral() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            // TODO: Add line number: this.line.
            this.errorHandler.add("Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
       const value = this.source.substring(this.start + 1, this.current - 1);
       this.addTokenLiteral(TokenType.STRING, value);
    }

    identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this.source.substring(this.start, this.current);
        const tokenType: undefined | TokenType = this.keywords[text];
            
        this.addToken(tokenType || TokenType.IDENTIFIER);
    }

    isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    isAlpha(c: string): boolean {
        const reg = /^[a-zA-Z]*$/;
        return reg.test(c) || c === '_';
    }
    
    isDigit(c: string): boolean {
        const reg = /^\d+$/;
        return reg.test(c);
    }
    
    scanNumberLiteral() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
    
        // Look for a fractional part.
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();
    
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
    
        this.addTokenLiteral(TokenType.NUMBER, Number(this.source.substring(this.start, this.current)));
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
