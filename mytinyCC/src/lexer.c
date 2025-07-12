// lexer.c - Implementation file

#include "lexer.h"

// Keyword table
typedef struct {
    const char* keyword;
    TokenType type;
} KeywordEntry;

static KeywordEntry keywords[] = {
    {"if", TOK_IF},
    {"else", TOK_ELSE},
    {"while", TOK_WHILE},
    {"for", TOK_FOR},
    {"return", TOK_RETURN},
    {"int", TOK_INT},
    {"char", TOK_CHAR_TYPE},
    {"void", TOK_VOID},
    {"struct", TOK_STRUCT},
    {"union", TOK_UNION},
    {"enum", TOK_ENUM},
    {"typedef", TOK_TYPEDEF},
    {"static", TOK_STATIC},
    {"extern", TOK_EXTERN},
    {"const", TOK_CONST},
    {"volatile", TOK_VOLATILE},
    {"sizeof", TOK_SIZEOF},
    {"break", TOK_BREAK},
    {"continue", TOK_CONTINUE},
    {"switch", TOK_SWITCH},
    {"case", TOK_CASE},
    {"default", TOK_DEFAULT},
    {"goto", TOK_GOTO},
    {NULL, TOK_UNKNOWN}
};

Lexer* create_lexer(const char* source) {
    Lexer* lexer = malloc(sizeof(Lexer));
    if (!lexer) return NULL;
    
    lexer->source = source;
    lexer->current = source;
    lexer->line = 1;
    lexer->column = 1;
    lexer->position = 0;
    lexer->length = strlen(source);
    
    return lexer;
}

void destroy_lexer(Lexer* lexer) {
    if (lexer) {
        free(lexer);
    }
}

Lexer* lexer_init(const char *input) {
    return create_lexer(input);
}

void destroy_token(Token* token) {
    if (token && token->value) {
        free(token->value);
        token->value = NULL;
    }
}

void lexer_free(Lexer* lexer) {
    if (!lexer) return;
    
    // Reset all pointers and values for safety
    lexer->source = NULL;
    lexer->current = NULL;
    lexer->line = 0;
    lexer->column = 0;
    lexer->position = 0;
    lexer->length = 0;
    
    // Free the lexer structure itself
    free(lexer);
}

char advance_char(Lexer* lexer) {
    if (lexer->position >= lexer->length) {
        return '\0';
    }
    
    char c = lexer->current[0];
    lexer->current++;
    lexer->position++;
    lexer->column++;
    
    if (c == '\n') {
        lexer->line++;
        lexer->column = 1;
    }
    
    return c;
}

char peek_char(Lexer* lexer) {
    if (lexer->position >= lexer->length) {
        return '\0';
    }
    return lexer->current[0];
}

char peek_next_char(Lexer* lexer) {
    if (lexer->position + 1 >= lexer->length) {
        return '\0';
    }
    return lexer->current[1];
}

void skip_whitespace(Lexer* lexer) {
    while (isspace(peek_char(lexer)) && peek_char(lexer) != '\0') {
        advance_char(lexer);
    }
}

void skip_comment(Lexer* lexer) {
    char c = peek_char(lexer);
    char next = peek_next_char(lexer);
    
    if (c == '/' && next == '/') {
        // Single-line comment
        advance_char(lexer); // consume '/'
        advance_char(lexer); // consume '/'
        
        while (peek_char(lexer) != '\n' && peek_char(lexer) != '\0') {
            advance_char(lexer);
        }
    } else if (c == '/' && next == '*') {
        // Multi-line comment
        advance_char(lexer); // consume '/'
        advance_char(lexer); // consume '*'
        
        while (peek_char(lexer) != '\0') {
            if (peek_char(lexer) == '*' && peek_next_char(lexer) == '/') {
                advance_char(lexer); // consume '*'
                advance_char(lexer); // consume '/'
                break;
            }
            advance_char(lexer);
        }
    }
}

Token read_identifier(Lexer* lexer) {
    Token token;
    const char* start = lexer->current;
    int start_line = lexer->line;
    int start_column = lexer->column;
    
    // Read identifier characters
    while (isalnum(peek_char(lexer)) || peek_char(lexer) == '_') {
        advance_char(lexer);
    }
    
    int length = lexer->current - start;
    token.value = extract_string(start, length);
    token.line = start_line;
    token.column = start_column;
    token.length = length;
    
    // Check if it's a keyword
    if (is_keyword(token.value)) {
        token.type = get_keyword_type(token.value);
    } else {
        token.type = TOK_IDENTIFIER;
    }
    
    return token;
}

Token read_number(Lexer* lexer) {
    Token token;
    const char* start = lexer->current;
    int start_line = lexer->line;
    int start_column = lexer->column;
    
    // Read integer part
    while (isdigit(peek_char(lexer))) {
        advance_char(lexer);
    }
    
    // Check for decimal point
    if (peek_char(lexer) == '.' && isdigit(peek_next_char(lexer))) {
        advance_char(lexer); // consume '.'
        while (isdigit(peek_char(lexer))) {
            advance_char(lexer);
        }
    }
    
    int length = lexer->current - start;
    token.type = TOK_NUMBER;
    token.value = extract_string(start, length);
    token.line = start_line;
    token.column = start_column;
    token.length = length;
    
    return token;
}

Token read_string(Lexer* lexer) {
    Token token;
    const char* start = lexer->current;
    int start_line = lexer->line;
    int start_column = lexer->column;
    
    advance_char(lexer); // consume opening quote
    
    while (peek_char(lexer) != '"' && peek_char(lexer) != '\0') {
        if (peek_char(lexer) == '\\') {
            advance_char(lexer); // consume backslash
            if (peek_char(lexer) != '\0') {
                advance_char(lexer); // consume escaped character
            }
        } else {
            advance_char(lexer);
        }
    }
    
    if (peek_char(lexer) == '"') {
        advance_char(lexer); // consume closing quote
    }
    
    int length = lexer->current - start;
    token.type = TOK_STRING;
    token.value = extract_string(start, length);
    token.line = start_line;
    token.column = start_column;
    token.length = length;
    
    return token;
}

Token read_char(Lexer* lexer) {
    Token token;
    const char* start = lexer->current;
    int start_line = lexer->line;
    int start_column = lexer->column;
    
    advance_char(lexer); // consume opening quote
    
    if (peek_char(lexer) == '\\') {
        advance_char(lexer); // consume backslash
        if (peek_char(lexer) != '\0') {
            advance_char(lexer); // consume escaped character
        }
    } else if (peek_char(lexer) != '\0') {
        advance_char(lexer); // consume character
    }
    
    if (peek_char(lexer) == '\'') {
        advance_char(lexer); // consume closing quote
    }
    
    int length = lexer->current - start;
    token.type = TOK_CHAR;
    token.value = extract_string(start, length);
    token.line = start_line;
    token.column = start_column;
    token.length = length;
    
    return token;
}

Token get_next_token(Lexer* lexer) {
    Token token;
    
    // Skip whitespace and comments
    while (1) {
        skip_whitespace(lexer);
        
        if (peek_char(lexer) == '/' && 
            (peek_next_char(lexer) == '/' || peek_next_char(lexer) == '*')) {
            skip_comment(lexer);
        } else {
            break;
        }
    }
    
    char c = peek_char(lexer);
    
    if (c == '\0') {
        token.type = TOK_EOF;
        token.value = NULL;
        token.line = lexer->line;
        token.column = lexer->column;
        token.length = 0;
        return token;
    }
    
    // Initialize token position
    token.line = lexer->line;
    token.column = lexer->column;
    
    // Identifiers and keywords
    if (isalpha(c) || c == '_') {
        return read_identifier(lexer);
    }
    
    // Numbers
    if (isdigit(c)) {
        return read_number(lexer);
    }
    
    // Strings
    if (c == '"') {
        return read_string(lexer);
    }
    
    // Character literals
    if (c == '\'') {
        return read_char(lexer);
    }
    
    // Two-character operators
    char next = peek_next_char(lexer);
    
    if (c == '+' && next == '+') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_INCREMENT;
        token.value = strdup("++");
        token.length = 2;
        return token;
    }
    
    if (c == '-' && next == '-') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_DECREMENT;
        token.value = strdup("--");
        token.length = 2;
        return token;
    }
    
    if (c == '=' && next == '=') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_EQUAL;
        token.value = strdup("==");
        token.length = 2;
        return token;
    }
    
    if (c == '!' && next == '=') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_NOT_EQUAL;
        token.value = strdup("!=");
        token.length = 2;
        return token;
    }
    
    if (c == '<' && next == '=') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_LESS_EQUAL;
        token.value = strdup("<=");
        token.length = 2;
        return token;
    }
    
    if (c == '>' && next == '=') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_GREATER_EQUAL;
        token.value = strdup(">=");
        token.length = 2;
        return token;
    }
    
    if (c == '&' && next == '&') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_LOGICAL_AND;
        token.value = strdup("&&");
        token.length = 2;
        return token;
    }
    
    if (c == '|' && next == '|') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_LOGICAL_OR;
        token.value = strdup("||");
        token.length = 2;
        return token;
    }
    
    if (c == '<' && next == '<') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_LEFT_SHIFT;
        token.value = strdup("<<");
        token.length = 2;
        return token;
    }
    
    if (c == '>' && next == '>') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_RIGHT_SHIFT;
        token.value = strdup(">>");
        token.length = 2;
        return token;
    }
    
    if (c == '-' && next == '>') {
        advance_char(lexer); advance_char(lexer);
        token.type = TOK_ARROW;
        token.value = strdup("->");
        token.length = 2;
        return token;
    }
    
    // Single-character tokens
    advance_char(lexer);
    token.length = 1;
    
    switch (c) {
        case '+': token.type = TOK_PLUS; token.value = strdup("+"); break;
        case '-': token.type = TOK_MINUS; token.value = strdup("-"); break;
        case '*': token.type = TOK_MULTIPLY; token.value = strdup("*"); break;
        case '/': token.type = TOK_DIVIDE; token.value = strdup("/"); break;
        case '%': token.type = TOK_MODULO; token.value = strdup("%"); break;
        case '=': token.type = TOK_ASSIGN; token.value = strdup("="); break;
        case '<': token.type = TOK_LESS_THAN; token.value = strdup("<"); break;
        case '>': token.type = TOK_GREATER_THAN; token.value = strdup(">"); break;
        case '!': token.type = TOK_LOGICAL_NOT; token.value = strdup("!"); break;
        case '&': token.type = TOK_BITWISE_AND; token.value = strdup("&"); break;
        case '|': token.type = TOK_BITWISE_OR; token.value = strdup("|"); break;
        case '^': token.type = TOK_BITWISE_XOR; token.value = strdup("^"); break;
        case '~': token.type = TOK_BITWISE_NOT; token.value = strdup("~"); break;
        case ';': token.type = TOK_SEMICOLON; token.value = strdup(";"); break;
        case ',': token.type = TOK_COMMA; token.value = strdup(","); break;
        case '.': token.type = TOK_DOT; token.value = strdup("."); break;
        case '?': token.type = TOK_QUESTION; token.value = strdup("?"); break;
        case ':': token.type = TOK_COLON; token.value = strdup(":"); break;
        case '(': token.type = TOK_LPAREN; token.value = strdup("("); break;
        case ')': token.type = TOK_RPAREN; token.value = strdup(")"); break;
        case '{': token.type = TOK_LBRACE; token.value = strdup("{"); break;
        case '}': token.type = TOK_RBRACE; token.value = strdup("}"); break;
        case '[': token.type = TOK_LBRACKET; token.value = strdup("["); break;
        case ']': token.type = TOK_RBRACKET; token.value = strdup("]"); break;
        default:
            printf("Unknown char: '%c' (ascii %d) at line %d col %d\n", c, c, lexer->line, lexer->column);
            token.type = TOK_UNKNOWN;
            token.value = malloc(2);
            token.value[0] = c;
            token.value[1] = '\0';
            break;
    }
    
    return token;
}

// Helper functions
int is_keyword(const char* str) {
    for (int i = 0; keywords[i].keyword != NULL; i++) {
        if (strcmp(str, keywords[i].keyword) == 0) {
            return 1;
        }
    }
    return 0;
}

TokenType get_keyword_type(const char* str) {
    for (int i = 0; keywords[i].keyword != NULL; i++) {
        if (strcmp(str, keywords[i].keyword) == 0) {
            return keywords[i].type;
        }
    }
    return TOK_IDENTIFIER;
}

char* extract_string(const char* start, int length) {
    char* str = malloc(length + 1);
    if (!str) return NULL;
    
    strncpy(str, start, length);
    str[length] = '\0';
    return str;
}

const char* token_type_to_string(TokenType type) {
    switch (type) {
        case TOK_EOF: return "EOF";
        case TOK_IDENTIFIER: return "IDENTIFIER";
        case TOK_NUMBER: return "NUMBER";
        case TOK_STRING: return "STRING";
        case TOK_CHAR: return "CHAR";
        case TOK_IF: return "IF";
        case TOK_ELSE: return "ELSE";
        case TOK_WHILE: return "WHILE";
        case TOK_FOR: return "FOR";
        case TOK_RETURN: return "RETURN";
        case TOK_INT: return "INT";
        case TOK_CHAR_TYPE: return "CHAR_TYPE";
        case TOK_VOID: return "VOID";
        case TOK_PLUS: return "PLUS";
        case TOK_MINUS: return "MINUS";
        case TOK_MULTIPLY: return "MULTIPLY";
        case TOK_DIVIDE: return "DIVIDE";
        case TOK_ASSIGN: return "ASSIGN";
        case TOK_SEMICOLON: return "SEMICOLON";
        case TOK_LPAREN: return "LPAREN";
        case TOK_RPAREN: return "RPAREN";
        case TOK_LBRACE: return "LBRACE";
        case TOK_RBRACE: return "RBRACE";
        default: return "UNKNOWN";
    }
}