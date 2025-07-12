// lexer.h - Header file for lexer

#ifndef LEXER_H
#define LEXER_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

// Token types
typedef enum {
    TOK_EOF = 0,
    TOK_IDENTIFIER,
    TOK_NUMBER,
    TOK_STRING,
    TOK_CHAR,
    
    // Keywords
    TOK_IF,
    TOK_ELSE,
    TOK_WHILE,
    TOK_FOR,
    TOK_RETURN,
    TOK_INT,
    TOK_CHAR_TYPE,
    TOK_VOID,
    TOK_STRUCT,
    TOK_UNION,
    TOK_ENUM,
    TOK_TYPEDEF,
    TOK_STATIC,
    TOK_EXTERN,
    TOK_CONST,
    TOK_VOLATILE,
    TOK_SIZEOF,
    TOK_BREAK,
    TOK_CONTINUE,
    TOK_SWITCH,
    TOK_CASE,
    TOK_DEFAULT,
    TOK_GOTO,
    
    // Operators
    TOK_PLUS,           // +
    TOK_MINUS,          // -
    TOK_MULTIPLY,       // *
    TOK_DIVIDE,         // /
    TOK_MODULO,         // %
    TOK_ASSIGN,         // =
    TOK_PLUS_ASSIGN,    // +=
    TOK_MINUS_ASSIGN,   // -=
    TOK_MULT_ASSIGN,    // *=
    TOK_DIV_ASSIGN,     // /=
    TOK_MOD_ASSIGN,     // %=
    TOK_INCREMENT,      // ++
    TOK_DECREMENT,      // --
    
    // Comparison operators
    TOK_EQUAL,          // ==
    TOK_NOT_EQUAL,      // !=
    TOK_LESS_THAN,      // <
    TOK_LESS_EQUAL,     // <=
    TOK_GREATER_THAN,   // >
    TOK_GREATER_EQUAL,  // >=
    
    // Logical operators
    TOK_LOGICAL_AND,    // &&
    TOK_LOGICAL_OR,     // ||
    TOK_LOGICAL_NOT,    // !
    
    // Bitwise operators
    TOK_BITWISE_AND,    // &
    TOK_BITWISE_OR,     // |
    TOK_BITWISE_XOR,    // ^
    TOK_BITWISE_NOT,    // ~
    TOK_LEFT_SHIFT,     // <<
    TOK_RIGHT_SHIFT,    // >>
    
    // Punctuation
    TOK_SEMICOLON,      // ;
    TOK_COMMA,          // ,
    TOK_DOT,            // .
    TOK_ARROW,          // ->
    TOK_QUESTION,       // ?
    TOK_COLON,          // :
    
    // Brackets
    TOK_LPAREN,         // (
    TOK_RPAREN,         // )
    TOK_LBRACE,         // {
    TOK_RBRACE,         // }
    TOK_LBRACKET,       // [
    TOK_RBRACKET,       // ]
    
    // Special
    TOK_NEWLINE,
    TOK_COMMENT,
    TOK_WHITESPACE,
    TOK_UNKNOWN
} TokenType;

// Token structure
typedef struct {
    TokenType type;
    char* value;
    int line;
    int column;
    int length;
} Token;

// Lexer structure
typedef struct {
    const char* source;
    const char* current;
    int line;
    int column;
    int position;
    int length;
} Lexer;




Lexer* lexer_init(const char *input);
// Function declarations
Lexer* create_lexer(const char* source);

void destroy_lexer(Lexer* lexer);
Token get_next_token(Lexer* lexer);
void destroy_token(Token* token);
const char* token_type_to_string(TokenType type);

// Helper functions
int is_keyword(const char* str);
TokenType get_keyword_type(const char* str);
char* extract_string(const char* start, int length);

#endif // LEXER_H

