#include "ast.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Helper function to allocate and initialize an AST node
static ASTNode* ast_create_node(ASTNodeType type) {
    ASTNode *node = malloc(sizeof(ASTNode));
    if (!node) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    node->type = type;
    memset(&node->data, 0, sizeof(node->data));
    return node;
}

// Create a number node
ASTNode* ast_create_number(int value) {
    ASTNode *node = ast_create_node(AST_NUMBER);
    node->data.int_val = value;
    return node;
}

// Create an identifier node
ASTNode* ast_create_identifier(char *name) {
    ASTNode *node = ast_create_node(AST_IDENTIFIER);
    node->data.string_val = strdup(name);
    if (!node->data.string_val) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    return node;
}

// Create a binary operation node
ASTNode* ast_create_binary_op(ASTNode *left, char op, ASTNode *right) {
    ASTNode *node = ast_create_node(AST_BINARY_OP);
    node->data.binary_op.left = left;
    node->data.binary_op.right = right;
    node->data.binary_op.operator = op;
    return node;
}

// Create a unary operation node
ASTNode* ast_create_unary_op(char op, ASTNode *operand) {
    ASTNode *node = ast_create_node(AST_UNARY_OP);
    node->data.unary_op.operator = op;
    node->data.unary_op.operand = operand;
    return node;
}

// Create an assignment node
ASTNode* ast_create_assignment(char *variable, ASTNode *expression) {
    ASTNode *node = ast_create_node(AST_ASSIGNMENT);
    node->data.assignment.variable = strdup(variable);
    node->data.assignment.expression = expression;
    if (!node->data.assignment.variable) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    return node;
}

// Create an if statement node
ASTNode* ast_create_if_stmt(ASTNode *condition, ASTNode *then_stmt, ASTNode *else_stmt) {
    ASTNode *node = ast_create_node(AST_IF_STMT);
    node->data.if_stmt.condition = condition;
    node->data.if_stmt.then_stmt = then_stmt;
    node->data.if_stmt.else_stmt = else_stmt;
    return node;
}

// Create a while statement node
ASTNode* ast_create_while_stmt(ASTNode *condition, ASTNode *body) {
    ASTNode *node = ast_create_node(AST_WHILE_STMT);
    node->data.while_stmt.condition = condition;
    node->data.while_stmt.body = body;
    return node;
}

// Create a block node
ASTNode* ast_create_block() {
    ASTNode *node = ast_create_node(AST_BLOCK);
    node->data.block.statements = NULL;
    node->data.block.count = 0;
    return node;
}

// Add a statement to a block
void ast_add_statement(ASTNode *block, ASTNode *stmt) {
    if (!block || block->type != AST_BLOCK) {
        fprintf(stderr, "Error: trying to add statement to non-block node\n");
        return;
    }
    
    // Reallocate the statements array
    block->data.block.statements = realloc(block->data.block.statements,
                                          (block->data.block.count + 1) * sizeof(ASTNode*));
    if (!block->data.block.statements) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    
    block->data.block.statements[block->data.block.count] = stmt;
    block->data.block.count++;
}

// Destroy an AST node and free its memory
void ast_destroy(ASTNode *node) {
    if (!node) return;
    
    switch (node->type) {
        case AST_NUMBER:
            // No additional cleanup needed
            break;
            
        case AST_IDENTIFIER:
            free(node->data.string_val);
            break;
            
        case AST_BINARY_OP:
            ast_destroy(node->data.binary_op.left);
            ast_destroy(node->data.binary_op.right);
            break;
            
        case AST_UNARY_OP:
            ast_destroy(node->data.unary_op.operand);
            break;
            
        case AST_ASSIGNMENT:
            free(node->data.assignment.variable);
            ast_destroy(node->data.assignment.expression);
            break;
            
        case AST_IF_STMT:
            ast_destroy(node->data.if_stmt.condition);
            ast_destroy(node->data.if_stmt.then_stmt);
            ast_destroy(node->data.if_stmt.else_stmt);
            break;
            
        case AST_WHILE_STMT:
            ast_destroy(node->data.while_stmt.condition);
            ast_destroy(node->data.while_stmt.body);
            break;
            
        case AST_BLOCK:
            for (int i = 0; i < node->data.block.count; i++) {
                ast_destroy(node->data.block.statements[i]);
            }
            free(node->data.block.statements);
            break;
            
        case AST_PROGRAM:
            // Handle program node if needed
            break;
    }
    
    free(node);
}

// Print an AST node with indentation
void ast_print(ASTNode *node, int indent) {
    if (!node) return;
    
    // Print indentation
    for (int i = 0; i < indent; i++) {
        printf("  ");
    }
    
    switch (node->type) {
        case AST_NUMBER:
            printf("Number: %d\n", node->data.int_val);
            break;
            
        case AST_IDENTIFIER:
            printf("Identifier: %s\n", node->data.string_val);
            break;
            
        case AST_BINARY_OP:
            printf("Binary Op: %c\n", node->data.binary_op.operator);
            ast_print(node->data.binary_op.left, indent + 1);
            ast_print(node->data.binary_op.right, indent + 1);
            break;
            
        case AST_UNARY_OP:
            printf("Unary Op: %c\n", node->data.unary_op.operator);
            ast_print(node->data.unary_op.operand, indent + 1);
            break;
            
        case AST_ASSIGNMENT:
            printf("Assignment: %s =\n", node->data.assignment.variable);
            ast_print(node->data.assignment.expression, indent + 1);
            break;
            
        case AST_IF_STMT:
            printf("If Statement:\n");
            for (int i = 0; i < indent + 1; i++) printf("  ");
            printf("Condition:\n");
            ast_print(node->data.if_stmt.condition, indent + 2);
            for (int i = 0; i < indent + 1; i++) printf("  ");
            printf("Then:\n");
            ast_print(node->data.if_stmt.then_stmt, indent + 2);
            if (node->data.if_stmt.else_stmt) {
                for (int i = 0; i < indent + 1; i++) printf("  ");
                printf("Else:\n");
                ast_print(node->data.if_stmt.else_stmt, indent + 2);
            }
            break;
            
        case AST_WHILE_STMT:
            printf("While Statement:\n");
            for (int i = 0; i < indent + 1; i++) printf("  ");
            printf("Condition:\n");
            ast_print(node->data.while_stmt.condition, indent + 2);
            for (int i = 0; i < indent + 1; i++) printf("  ");
            printf("Body:\n");
            ast_print(node->data.while_stmt.body, indent + 2);
            break;
            
        case AST_BLOCK:
            printf("Block (%d statements):\n", node->data.block.count);
            for (int i = 0; i < node->data.block.count; i++) {
                ast_print(node->data.block.statements[i], indent + 1);
            }
            break;
            
        case AST_PROGRAM:
            printf("Program:\n");
            break;
    }
}