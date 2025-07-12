#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "lexer.h"

// 关键字映射表
typedef struct {
    const char *keyword;
    TokenType type;
} KeywordMap;

static KeywordMap keywords[] = {
    {"if", TOKEN_IF},
    {"else", TOKEN_ELSE},
    {"while", TOKEN_WHILE},
    {NULL, TOKEN_EOF}
};

// 创建词法分析器
Lexer* lexer_create(const char *input) {
    Lexer *lexer = malloc(sizeof(Lexer));
    if (!lexer) return NULL;
    
    lexer->input = input;
    lexer->position = 0;
    lexer->length = strlen(input);
    lexer->line = 1;
    lexer->column = 1;
    lexer->current_token.type = TOKEN_EOF;
    lexer->current_token.value = NULL;
    
    return lexer;
}

// 销毁词法分析器
void lexer_destroy(Lexer *lexer) {
    if (lexer) {
        if (lexer->current_token.value) {
            free(lexer->current_token.value);
        }
        free(lexer);
    }
}

// 获取当前字符
static char current_char(Lexer *lexer) {
    if (lexer->position >= lexer->length) {
        return '\0';
    }
    return lexer->input[lexer->position];
}

// 前进一个字符
static void advance(Lexer *lexer) {
    if (lexer->position < lexer->length) {
        if (lexer->input[lexer->position] == '\n') {
            lexer->line++;
            lexer->column = 1;
        } else {
            lexer->column++;
        }
        lexer->position++;
    }
}

// 跳过空白字符
static void skip_whitespace(Lexer *lexer) {
    while (isspace(current_char(lexer))) {
        advance(lexer);
    }
}

// 跳过注释
static void skip_comment(Lexer *lexer) {
    if (current_char(lexer) == '/' && 
        lexer->position + 1 < lexer->length && 
        lexer->input[lexer->position + 1] == '/') {
        // 单行注释
        while (current_char(lexer) != '\n' && current_char(lexer) != '\0') {
            advance(lexer);
        }
    } else if (current_char(lexer) == '/' && 
               lexer->position + 1 < lexer->length && 
               lexer->input[lexer->position + 1] == '*') {
        // 多行注释
        advance(lexer); // 跳过 '/'
        advance(lexer); // 跳过 '*'
        
        while (lexer->position + 1 < lexer->length) {
            if (current_char(lexer) == '*' && 
                lexer->input[lexer->position + 1] == '/') {
                advance(lexer); // 跳过 '*'
                advance(lexer); // 跳过 '/'
                break;
            }
            advance(lexer);
        }
    }
}

// 读取数字
static Token read_number(Lexer *lexer) {
    Token token;
    token.line = lexer->line;
    token.column = lexer->column;
    
    size_t start = lexer->position;
    _Bool  has_dot = 0;
    
    while (isdigit(current_char(lexer)) || current_char(lexer) == '.') {
        if (current_char(lexer) == '.') {
            if (has_dot) break; // 第二个点，停止
            has_dot = 1;
        }
        advance(lexer);
    }
    
    size_t length = lexer->position - start;
    token.value = malloc(length + 1);
    strncpy(token.value, lexer->input + start, length);
    token.value[length] = '\0';
    
    token.type = TOKEN_NUMBER;
    if (has_dot) {
        token.data.float_val = atof(token.value);
    } else {
        token.data.int_val = atoi(token.value);
    }
    
    return token;
}

// 读取标识符
static Token read_identifier(Lexer *lexer) {
    Token token;
    token.line = lexer->line;
    token.column = lexer->column;
    
    size_t start = lexer->position;
    
    while (isalnum(current_char(lexer)) || current_char(lexer) == '_') {
        advance(lexer);
    }
    
    size_t length = lexer->position - start;
    token.value = malloc(length + 1);
    strncpy(token.value, lexer->input + start, length);
    token.value[length] = '\0';
    
    // 检查是否为关键字
    token.type = TOKEN_IDENTIFIER;
    for (int i = 0; keywords[i].keyword != NULL; i++) {
        if (strcmp(token.value, keywords[i].keyword) == 0) {
            token.type = keywords[i].type;
            break;
        }
    }
    
    return token;
}

// 获取下一个Token
Token lexer_next_token(Lexer *lexer) {
    Token token;
    
    // 释放之前的token值
    if (lexer->current_token.value) {
        free(lexer->current_token.value);
        lexer->current_token.value = NULL;
    }
    
    while (lexer->position < lexer->length) {
        skip_whitespace(lexer);
        
        if (current_char(lexer) == '\0') {
            break;
        }
        
        // 跳过注释
        if (current_char(lexer) == '/') {
            skip_comment(lexer);
            continue;
        }
        
        token.line = lexer->line;
        token.column = lexer->column;
        token.value = NULL;
        
        char c = current_char(lexer);
        
        // 数字
        if (isdigit(c)) {
            token = read_number(lexer);
            lexer->current_token = token;
            return token;
        }
        
        // 标识符和关键字
        if (isalpha(c) || c == '_') {
            token = read_identifier(lexer);
            lexer->current_token = token;
            return token;
        }
        
        // 操作符和特殊字符
        advance(lexer);
        
        switch (c) {
            case '+': token.type = TOKEN_PLUS; break;
            case '-': token.type = TOKEN_MINUS; break;
            case '*': token.type = TOKEN_MULTIPLY; break;
            case '/': token.type = TOKEN_DIVIDE; break;
            case '(': token.type = TOKEN_LPAREN; break;
            case ')': token.type = TOKEN_RPAREN; break;
            case '{': token.type = TOKEN_LBRACE; break;
            case '}': token.type = TOKEN_RBRACE; break;
            case ';': token.type = TOKEN_SEMICOLON; break;
            case '=':
                if (current_char(lexer) == '=') {
                    advance(lexer);
                    token.type = TOKEN_EQ;
                } else {
                    token.type = TOKEN_ASSIGN;
                }
                break;
            case '!':
                if (current_char(lexer) == '=') {
                    advance(lexer);
                    token.type = TOKEN_NE;
                } else {
                    token.type = TOKEN_ERROR;
                }
                break;
            case '<':
                if (current_char(lexer) == '=') {
                    advance(lexer);
                    token.type = TOKEN_LE;
                } else {
                    token.type = TOKEN_LT;
                }
                break;
            case '>':
                if (current_char(lexer) == '=') {
                    advance(lexer);
                    token.type = TOKEN_GE;
                } else {
                    token.type = TOKEN_GT;
                }
                break;
            default:
                token.type = TOKEN_ERROR;
                break;
        }
        
        lexer->current_token = token;
        return token;
    }
    
    // EOF
    token.type = TOKEN_EOF;
    token.value = NULL;
    token.line = lexer->line;
    token.column = lexer->column;
    lexer->current_token = token;
    return token;
}

// 查看下一个Token但不消费
Token lexer_peek_token(Lexer *lexer) {
    size_t saved_position = lexer->position;
    int saved_line = lexer->line;
    int saved_column = lexer->column;
    
    Token token = lexer_next_token(lexer);
    
    // 恢复状态
    lexer->position = saved_position;
    lexer->line = saved_line;
    lexer->column = saved_column;
    
    return token;
}

// Token类型转字符串
const char* token_type_to_string(TokenType type) {
    switch (type) {
        case TOKEN_EOF: return "EOF";
        case TOKEN_NUMBER: return "NUMBER";
        case TOKEN_IDENTIFIER: return "IDENTIFIER";
        case TOKEN_PLUS: return "PLUS";
        case TOKEN_MINUS: return "MINUS";
        case TOKEN_MULTIPLY: return "MULTIPLY";
        case TOKEN_DIVIDE: return "DIVIDE";
        case TOKEN_LPAREN: return "LPAREN";
        case TOKEN_RPAREN: return "RPAREN";
        case TOKEN_ASSIGN: return "ASSIGN";
        case TOKEN_SEMICOLON: return "SEMICOLON";
        case TOKEN_IF: return "IF";
        case TOKEN_ELSE: return "ELSE";
        case TOKEN_WHILE: return "WHILE";
        case TOKEN_LBRACE: return "LBRACE";
        case TOKEN_RBRACE: return "RBRACE";
        case TOKEN_EQ: return "EQ";
        case TOKEN_NE: return "NE";
        case TOKEN_LT: return "LT";
        case TOKEN_LE: return "LE";
        case TOKEN_GT: return "GT";
        case TOKEN_GE: return "GE";
        case TOKEN_ERROR: return "ERROR";
        default: return "UNKNOWN";
    }
}