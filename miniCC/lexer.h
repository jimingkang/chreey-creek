#ifndef LEXER_H
#define LEXER_H
#include "ast.h"
// Token类型定义
typedef enum {
    TOKEN_EOF = 0,
    TOKEN_NUMBER,
    TOKEN_IDENTIFIER,
    TOKEN_PLUS,
    TOKEN_MINUS,
    TOKEN_MULTIPLY,
    TOKEN_DIVIDE,
    TOKEN_LPAREN,
    TOKEN_RPAREN,
    TOKEN_ASSIGN,
    TOKEN_SEMICOLON,
    TOKEN_IF,
    TOKEN_ELSE,
    TOKEN_WHILE,
    TOKEN_LBRACE,
    TOKEN_RBRACE,
    TOKEN_EQ,
    TOKEN_NE,
    TOKEN_LT,
    TOKEN_LE,
    TOKEN_GT,
    TOKEN_GE,
    TOKEN_ERROR
} TokenType;

// Token结构体
typedef struct {
    TokenType type;
    char *value;
    int line;
    int column;
    union {
        int int_val;
        double float_val;
        char *string_val;
    } data;
} Token;

// Lexer状态结构体
typedef struct {
    const char *input;
    size_t position;
    size_t length;
    int line;
    int column;
    Token current_token;
    
} Lexer;
typedef struct ParserContext {
    ASTNode* root;
    int error_count;
  //  FILE* source_file;  // ✅ 现在不会报错了
} ParserContext;

// 函数声明
Lexer* lexer_create(const char *input);
void lexer_destroy(Lexer *lexer);
Token lexer_next_token(Lexer *lexer);
Token lexer_peek_token(Lexer *lexer);
const char* token_type_to_string(TokenType type);

#endif