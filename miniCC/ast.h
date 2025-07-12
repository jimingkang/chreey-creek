#ifndef AST_H
#define AST_H
#include <stdio.h> 
typedef enum {
    AST_NUMBER,
    AST_IDENTIFIER,
    AST_BINARY_OP,
    AST_UNARY_OP,
    AST_ASSIGNMENT,
    AST_IF_STMT,
    AST_WHILE_STMT,
    AST_BLOCK,
    AST_PROGRAM
} ASTNodeType;

typedef struct ASTNode {
    ASTNodeType type;
    union {
        int int_val;
        double float_val;
        char *string_val;
        struct {
            struct ASTNode *left;
            struct ASTNode *right;
            char operator;
        } binary_op;
        struct {
            struct ASTNode *operand;
            char operator;
        } unary_op;
        struct {
            char *variable;
            struct ASTNode *expression;
        } assignment;
        struct {
            struct ASTNode *condition;
            struct ASTNode *then_stmt;
            struct ASTNode *else_stmt;
        } if_stmt;
        struct {
            struct ASTNode *condition;
            struct ASTNode *body;
        } while_stmt;
        struct {
            struct ASTNode **statements;
            int count;
        } block;
    } data;
} ASTNode;



// AST函数声明
ASTNode* ast_create_number(int value);
ASTNode* ast_create_identifier(char *name);
ASTNode* ast_create_binary_op(ASTNode *left, char op, ASTNode *right);
void ast_destroy(ASTNode *node);
void ast_print(ASTNode *node, int indent);

ASTNode* ast_create_unary_op(char op, ASTNode *operand);
ASTNode* ast_create_assignment(char *variable, ASTNode *expression);
ASTNode* ast_create_if_stmt(ASTNode *condition, ASTNode *then_stmt, ASTNode *else_stmt);
ASTNode* ast_create_while_stmt(ASTNode *condition, ASTNode *body);
ASTNode* ast_create_block();
void ast_add_statement(ASTNode *block, ASTNode *stmt);

#endif