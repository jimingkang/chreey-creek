#ifndef PARSER_H
#define PARSER_H

#include "lexer.h"
#include <string.h>

#define COPY_STRING(s) ((s) ? strdup(s) : NULL)
// AST Node Types
typedef enum {
    AST_PROGRAM,
    AST_FUNCTION,
    AST_BLOCK,
    AST_IF,
    AST_WHILE,
    AST_FOR,
    AST_RETURN,
    AST_EXPRESSION,
    AST_ASSIGNMENT,
    AST_BINARY_OP,
    AST_UNARY_OP,
    AST_IDENTIFIER,
    AST_LITERAL,
    AST_CALL,
    AST_DECLARATION
} ASTNodeType;

// Forward declaration
typedef struct ASTNode ASTNode;

// AST Node Structure
struct ASTNode {
    ASTNodeType type;
    int line;
    int column;
    
    // Node connections
    ASTNode* left;
    ASTNode* right;
    ASTNode* next;
    
    // Node data
    union {
        struct {
            char* name;
            ASTNode* params;
            ASTNode* body;
        } function;
        
        struct {
            ASTNode* condition;
            ASTNode* then_branch;
            ASTNode* else_branch;
        } if_stmt;
        
        struct {
            ASTNode* condition;
            ASTNode* body;
        } while_stmt;
        
        struct {
            ASTNode* init;
            ASTNode* condition;
            ASTNode* update;
            ASTNode* body;
        } for_stmt;
        
        struct {
            char* operator;
            ASTNode* operand;
        } unary;
        
        struct {
            char* operator;
            ASTNode* left;
            ASTNode* right;
        } binary;
        
        struct {
            char* name;
            ASTNode* args;
        } call;
        
        struct {
            char* name;
            char* type;
            ASTNode* initializer;
        } declaration;
        
        struct {
            char* value;
            TokenType value_type;
        } literal;
        
        char* identifier;
    } data;
};

// Parser Structure - Works with full Token structs
typedef struct {
    Lexer* lexer;
    Token current_token;
    Token peek_token;
    int error_count;
} Parser;

// Function declarations
Parser* create_parser(Lexer* lexer);
void destroy_parser(Parser* parser);
ASTNode* create_node(ASTNodeType type);
void destroy_node(ASTNode* node);

// Parsing functions
Parser* parser_init(const char* source);
ASTNode* parse_program(Parser* parser);
ASTNode* parse_function(Parser* parser);
ASTNode* parse_statement(Parser* parser);
ASTNode* parse_if(Parser* parser);
ASTNode* parse_while(Parser* parser);
ASTNode* parse_for(Parser* parser);
ASTNode* parse_block(Parser* parser);
ASTNode* parse_return(Parser* parser);
ASTNode* parse_expression(Parser* parser);
ASTNode* parse_assignment(Parser* parser);
ASTNode* parse_binary_expression(Parser* parser, int precedence);
ASTNode* parse_unary_expression(Parser* parser);
ASTNode* parse_primary(Parser* parser);
ASTNode* parse_call(Parser* parser, ASTNode* function);
ASTNode* parse_declaration(Parser* parser);

void parser_free(Parser* parser);

// Utility functions
void advance_token(Parser* parser);
int match_token(Parser* parser, TokenType type);
int expect_token(Parser* parser, TokenType type);
void parser_error(Parser* parser, const char* message);

#endif // PARSER_H
