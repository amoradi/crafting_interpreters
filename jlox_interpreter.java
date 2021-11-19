//
// The interpreter starts at https://craftinginterpreters.com/a-tree-walk-interpreter.html
//
package com.craftinginterpreters.lox;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

// TODO: Make a parallel TS version! (YOU IDIOT.)

public class Lox {
    // Run Lox via these private 2 methods.
    private static void runFile(String path) throws IOException {
        byte[] bytes = Files.readAllBytes(Paths.get(path));
        run(new String(bytes, Charset.defaultCharset()));
    }

    private static void runPrompt() throws IOException {
        InputStreamReader input = new InputStreamReader(System.in);
        BufferedReader reader = new BufferedReader(input);

        for (;;) { 
        System.out.print("> ");
        String line = reader.readLine();
        if (line == null) break;
        run(line);
        }
    }

    // Print out tokens for now.
    private static void run(String source) {
        Scanner scanner = new Scanner(source);
        List<Token> tokens = scanner.scanTokens();
    
        // For now, just print the tokens.
        for (Token token : tokens) {
          System.out.println(token);
        }
      }

    // We’ll use this to ensure we don’t try to execute code that has a known error.
    // Also, it lets us exit with a non-zero exit code like a good command line citizen should.
    static boolean hadError = false;

    public static void main(String[] args) throws IOException {
        if (args.length > 1) {
        System.out.println("Usage: jlox [script]");
        System.exit(64); 
        } else if (args.length == 1) {
        runFile(args[0]);
        } else {
        runPrompt();
        }
    }
}


package com.craftinginterpreters.lox;

// Keywords are part of the shape of the language’s grammar, so the parser often has code like,
// “If the next token is while then do . . . ” That means the parser wants to know not just that
// it has a lexeme for some identifier, but that it has a reserved word, and which keyword it is.

// The parser could categorize tokens from the raw lexeme by comparing the strings, but that’s
// slow and kind of ugly. Instead, at the point that we recognize a lexeme, we also remember which
// kind of lexeme it represents. 

// Lexemes are
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

// Starting at the first character of the source code, the scanner figures out what
// lexeme the character belongs to, and consumes it and any following characters that
// are part of that lexeme. When it reaches the end of that lexeme, it emits a token.

// If you did think of regular expressions, your intuition is a deep one.
// 
// ***The rules that determine how a particular language groups characters into
// lexemes are called its lexical grammar.***
//
// ***In Lox, as in most programming languages, the rules of that grammar are
// simple enough for the language to be classified a regular language.***
//
// ***That’s the same “regular” as in regular expressions.***
//
// You very precisely can recognize all of the different lexemes for Lox using regexes if
// you want to, and there’s a pile of interesting theory underlying why that is
// and what it means.
//
// ***Tools like Lex or Flex are designed expressly to let you do this—throw
// a handful of regexes at them, and they give you a complete scanner back.***

package com.craftinginterpreters.lox;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.craftinginterpreters.lox.TokenType.*; 

class Scanner {
  private final String source;
  private final List<Token> tokens = new ArrayList<>();
  private int start = 0;
  private int current = 0;
  private int line = 1;

  Scanner(String source) {
    this.source = source;
  }

  List<Token> scanTokens() {
    while (!isAtEnd()) {
      // We are at the beginning of the next lexeme.
      start = current;
      scanToken();
    }

    tokens.add(new Token(EOF, "", null, line));
    return tokens;
  }

  private boolean isAtEnd() {
    return current >= source.length();
  }

  private void scanToken() {
    char c = advance();
    switch (c) {
      case '(': addToken(LEFT_PAREN); break;
      case ')': addToken(RIGHT_PAREN); break;
      case '{': addToken(LEFT_BRACE); break;
      case '}': addToken(RIGHT_BRACE); break;
      case ',': addToken(COMMA); break;
      case '.': addToken(DOT); break;
      case '-': addToken(MINUS); break;
      case '+': addToken(PLUS); break;
      case ';': addToken(SEMICOLON); break;
      case '*': addToken(STAR); break; 
      default:
        Lox.error(line, "Unexpected character.");
        break;
    }
  }

  private void addToken(TokenType type) {
    addToken(type, null);
  }

  private void addToken(TokenType type, Object literal) {
    String text = source.substring(start, current);
    tokens.add(new Token(type, text, literal, line));
  }
}

/*

    Now we have an object with enough structure to be useful for all of the later phases of the interpreter.

*/
package com.craftinginterpreters.lox;

class Token {
  final TokenType type;
  final String lexeme; // The lexemes are only the raw substrings of the source code
  final Object literal;
  final int line; 

  Token(TokenType type, String lexeme, Object literal, int line) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  public String toString() {
    return type + " " + lexeme + " " + literal;
  }
}
