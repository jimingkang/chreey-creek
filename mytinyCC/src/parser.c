
#include "parser.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include "lexer.h"

Parser* create_parser(Lexer* lexer) {
    Parser* parser = malloc(sizeof(Parser));
    if (!parser) return NULL;
    
    parser->lexer = lexer;
    parser->error_count = 0;
    
    // Initialize with first two tokens
    parser->current_token = get_next_token(lexer);
    parser->peek_token = get_next_token(lexer);
    
    return parser;
}

void destroy_parser(Parser* parser) {
    if (parser) {
        destroy_token(&parser->current_token);
        destroy_token(&parser->peek_token);
        free(parser);
    }
}

void parser_free(Parser* parser) {
    if (!parser) return;
    
    // Clean up tokens - check if they have allocated memory
    if (parser->current_token.value) {
        free(parser->current_token.value);
        parser->current_token.value = NULL;
    }
    
    if (parser->peek_token.value) {
        free(parser->peek_token.value);
        parser->peek_token.value = NULL;
    }
    
    // Clean up lexer
    if (parser->lexer) {
        destroy_lexer(parser->lexer);
        parser->lexer = NULL;
    }
    
    // Reset error count
    parser->error_count = 0;
    
    // Free the parser structure itself
    free(parser);
}


// Parser implementation
Parser* parser_init(const char* source) {
    Parser* parser = malloc(sizeof(Parser));
    if (!parser) return NULL;
    
    parser->lexer = create_lexer(source);
    if (!parser->lexer) {
        free(parser);
        return NULL;
    }
    
    parser->error_count = 0;
    
    // Initialize tokens
    parser->current_token = get_next_token(parser->lexer);
    parser->peek_token = get_next_token(parser->lexer);
    
    return parser;
}



ASTNode* create_node(ASTNodeType type) {
    ASTNode* node = malloc(sizeof(ASTNode));
    if (!node) return NULL;
    
    memset(node, 0, sizeof(ASTNode));
    node->type = type;
    
    return node;
}

void destroy_node(ASTNode* node) {
    if (!node) return;
    
    // Recursively destroy child nodes
    destroy_node(node->left);
    destroy_node(node->right);
    destroy_node(node->next);
    
    // Free type-specific data
    switch (node->type) {
        case AST_FUNCTION:
            free(node->data.function.name);
            destroy_node(node->data.function.params);
            destroy_node(node->data.function.body);
            break;
        case AST_IDENTIFIER:
            free(node->data.identifier);
            break;
        case AST_LITERAL:
            free(node->data.literal.value);
            break;
        case AST_CALL:
            free(node->data.call.name);
            destroy_node(node->data.call.args);
            break;
        case AST_DECLARATION:
            free(node->data.declaration.name);
            free(node->data.declaration.type);
            destroy_node(node->data.declaration.initializer);
            break;
        case AST_BINARY_OP:
            free(node->data.binary.operator);
            break;
        case AST_UNARY_OP:
            free(node->data.unary.operator);
            break;
        default:
            break;
    }
    
    free(node);
}

void advance_token(Parser* parser) {
    destroy_token(&parser->current_token);
    parser->current_token = parser->peek_token;
    parser->peek_token = get_next_token(parser->lexer);
}

int match_token(Parser* parser, TokenType type) {
    if (parser->current_token.type == type) {
        advance_token(parser);
        return 1;
    }
    return 0;
}

int expect_token(Parser* parser, TokenType type) {
    if (parser->current_token.type == type) {
        advance_token(parser);
        return 1;
    }
    parser_error(parser, "Unexpected token");
    return 0;
}

void parser_error(Parser* parser, const char* message) {
    fprintf(stderr, "Parser error at line %d, column %d: %s\n", 
            parser->current_token.line, 
            parser->current_token.column, 
            message);
    parser->error_count++;
}

// Fixed parse_return function
ASTNode* parse_return(Parser* parser) {
    ASTNode* ret = create_node(AST_RETURN);
    if (!ret) return NULL;
    
    ret->line = parser->current_token.line;
    ret->column = parser->current_token.column;
    
    advance_token(parser); // consume 'return'
    
    if (parser->current_token.type != TOK_SEMICOLON) {
        ret->left = parse_expression(parser);
    }
    
    expect_token(parser, TOK_SEMICOLON);
    return ret;
}



ASTNode* parse_if(Parser* parser) {
    ASTNode* node = create_node(AST_IF);
    advance_token(parser); // consume 'if'

    expect_token(parser, TOK_LPAREN);
    node->data.if_stmt.condition = parse_expression(parser);
    expect_token(parser, TOK_RPAREN);

    node->data.if_stmt.then_branch = parse_statement(parser);

    if (match_token(parser, TOK_ELSE)) {
        node->data.if_stmt.else_branch = parse_statement(parser);
    }
    return node;
}

/*
// Fixed parse_if function
ASTNode* parse_if(Parser* parser) {
    ASTNode* if_stmt = create_node(AST_IF);
    if (!if_stmt) return NULL;
    
    if_stmt->line = parser->current_token.line;
    if_stmt->column = parser->current_token.column;
    
    advance_token(parser); // consume 'if'
    
    expect_token(parser, TOK_LPAREN);
    if_stmt->data.if_stmt.condition = parse_expression(parser);
    expect_token(parser, TOK_RPAREN);
    
    if_stmt->data.if_stmt.then_branch = parse_statement(parser);
    
    if (match_token(parser, TOK_ELSE)) {
        if_stmt->data.if_stmt.else_branch = parse_statement(parser);
    }
    
    return if_stmt;
}
*/


ASTNode* parse_program(Parser* parser) {
    ASTNode* root = create_node(AST_PROGRAM);
    ASTNode* current = NULL;

    while (parser->current_token.type != TOK_EOF) {
        ASTNode* stmt = NULL;

        // 识别函数定义：例如 int main(...)
        if ((parser->current_token.type == TOK_INT ||
             parser->current_token.type == TOK_VOID ||
             parser->current_token.type == TOK_CHAR_TYPE) &&
            parser->peek_token.type == TOK_IDENTIFIER) {

            // 进一步 peek 判断是否函数（必须接着是 LPAREN）
            Token third = get_next_token(parser->lexer);
            if (third.type == TOK_LPAREN) {
                // 回退 peek_token（手动重设）
                parser->lexer->current -= third.length;
                parser->peek_token = third;

                stmt = parse_function(parser);
            } else {
                // 非函数，回退 lexer 状态
                parser->lexer->current -= third.length;
                parser->peek_token = third;
                stmt = parse_statement(parser);
            }

        } else {
            // 普通语句（表达式、if、while 等）
            stmt = parse_statement(parser);
        }

        if (!stmt) break;

        if (!root->left) {
            root->left = stmt;
            current = stmt;
        } else {
            current->next = stmt;
            current = stmt;
        }
    }

    return root;
}


// Minimal parse_declaration() as a stub
ASTNode* parse_declaration(Parser* parser) {
    // Example: int x;
    if (parser->current_token.type == TOK_INT) {
        advance_token(parser);
        if (parser->current_token.type == TOK_IDENTIFIER) {
            ASTNode* node = create_node(AST_DECLARATION);
            node->line = parser->current_token.line;
            node->column = parser->current_token.column;
            node->data.declaration.type = COPY_STRING("int");
            node->data.declaration.name = COPY_STRING(parser->current_token.value);
            advance_token(parser);
            expect_token(parser, TOK_SEMICOLON);
            return node;
        }
    }
    parser_error(parser, "Expected declaration");
    return NULL;
}


    
/*
ASTNode* parse_assignment(Parser* parser) {
    if (parser->current_token.type != TOK_IDENTIFIER) {
        parser_error(parser, "Expected identifier in assignment");
        return NULL;
    }
    ASTNode* node = create_node(AST_ASSIGNMENT);
    node->line = parser->current_token.line;
    node->column = parser->current_token.column;
    node->data.identifier = COPY_STRING(parser->current_token.value);
    advance_token(parser);

    expect_token(parser, TOK_ASSIGN);

    node->left = parse_expression(parser);

    expect_token(parser, TOK_SEMICOLON);
    return node;
}
*/
ASTNode* parse_assignment(Parser* parser) {
    ASTNode* expr = parse_binary_expression(parser, 0);
    
    if (parser->current_token.type == TOK_ASSIGN) {
        ASTNode* assign = create_node(AST_ASSIGNMENT);
        assign->left = expr;
        advance_token(parser); // consume '='
        assign->right = parse_assignment(parser);
        return assign;
    }
    
    return expr;
}

ASTNode* parse_expression_statement(Parser* parser) {
    ASTNode* expr = parse_expression(parser);
    expect_token(parser, TOK_SEMICOLON);
    return expr;
}

ASTNode* parse_statement(Parser* parser) {
    switch (parser->current_token.type) {
        case TOK_IF:
            return parse_if(parser);
        case TOK_WHILE:
            return parse_while(parser);
        case TOK_FOR:
            return parse_for(parser);
        case TOK_RETURN:
            return parse_return(parser);
        case TOK_LBRACE:
            return parse_block(parser);
        default:
            return parse_expression_statement(parser);
    }
}



ASTNode* parse_expression(Parser* parser) {
    ASTNode* expr = parse_binary_expression(parser, 0);

    if (parser->current_token.type == TOK_ASSIGN && expr->type == AST_IDENTIFIER) {
        ASTNode* assign = create_node(AST_ASSIGNMENT);
        assign->data.identifier = COPY_STRING(expr->data.identifier);
        destroy_node(expr);
        advance_token(parser); // consume '='
        assign->left = parse_expression(parser);
        return assign;
    }

    return expr;
}

ASTNode* parse_binary_expression(Parser* parser, int precedence) {
    ASTNode* left = parse_primary(parser);
    while (1) {
        TokenType type = parser->current_token.type;
        int current_precedence = 0;

        switch (type) {
            case TOK_PLUS:
            case TOK_MINUS:
                current_precedence = 1;
                break;
            case TOK_MULTIPLY:
            case TOK_DIVIDE:
                current_precedence = 2;
                break;
            case TOK_GREATER_THAN:
            case TOK_LESS_THAN:
            case TOK_EQUAL:
            case TOK_NOT_EQUAL:
                current_precedence = 0;
                break;
            default:
                return left;
        }

        if (current_precedence < precedence)
            break;

        advance_token(parser);
        ASTNode* right = parse_binary_expression(parser, current_precedence + 1);

        ASTNode* bin = create_node(AST_BINARY_OP);
        bin->data.binary.operator = COPY_STRING(token_type_to_string(type));
        bin->data.binary.left = left;
        bin->data.binary.right = right;
        left = bin;
    }
    return left;
}


/*
ASTNode* parse_expression(Parser* parser) {
    return parse_binary_expression(parser, 0);
}

ASTNode* parse_binary_expression(Parser* parser, int precedence) {
    ASTNode* left = parse_primary(parser);
    while (1) {
        TokenType type = parser->current_token.type;
        int current_precedence = 0;

        switch (type) {
            case TOK_PLUS: case TOK_MINUS:
                current_precedence = 1;
                break;
            case TOK_MULTIPLY: case TOK_DIVIDE:
                current_precedence = 2;
                break;
            case TOK_GREATER_THAN: case TOK_LESS_THAN:
            case TOK_EQUAL: case TOK_NOT_EQUAL:
                current_precedence = 0; // Comparison lower
                break;
            default:
                return left;
        }

        if (current_precedence < precedence)
            break;

        advance_token(parser);
        ASTNode* right = parse_binary_expression(parser, current_precedence + 1);

        ASTNode* bin = create_node(AST_BINARY_OP);
        bin->data.binary.operator = COPY_STRING(token_type_to_string(type));
        bin->data.binary.left = left;
        bin->data.binary.right = right;
        left = bin;
    }
    return left;
}

*/

ASTNode* parse_primary(Parser* parser) {
    if (parser->current_token.type == TOK_NUMBER) {
        ASTNode* node = create_node(AST_LITERAL);
        node->data.literal.value = COPY_STRING(parser->current_token.value);
        node->data.literal.value_type = TOK_NUMBER;
        advance_token(parser);
        return node;
    } else if (parser->current_token.type == TOK_IDENTIFIER) {
        ASTNode* node = create_node(AST_IDENTIFIER);
        node->data.identifier = COPY_STRING(parser->current_token.value);
        advance_token(parser);
        return node;
    } else if (parser->current_token.type == TOK_LPAREN) {
        advance_token(parser);
        ASTNode* expr = parse_expression(parser);
        expect_token(parser, TOK_RPAREN);
        return expr;
    }
    parser_error(parser, "Expected primary expression");
    return NULL;
}




ASTNode* parse_while(Parser* parser) {
    parser_error(parser, "parse_while not implemented");
    return NULL;
}

ASTNode* parse_for(Parser* parser) {
    parser_error(parser, "parse_for not implemented");
    return NULL;
}

ASTNode* parse_block(Parser* parser) {
    expect_token(parser, TOK_LBRACE);
    ASTNode* block = create_node(AST_BLOCK);
    ASTNode* current = NULL;
    while (parser->current_token.type != TOK_RBRACE && parser->current_token.type != TOK_EOF) {
        ASTNode* stmt = parse_statement(parser);
        if (!stmt) break;
        if (!block->left) {
            block->left = stmt;
            current = stmt;
        } else {
            current->next = stmt;
            current = stmt;
        }
    }
    expect_token(parser, TOK_RBRACE);
    return block;
}

ASTNode* parse_function(Parser* parser) {
    // 1. 返回类型
    TokenType return_type = parser->current_token.type;
    advance_token(parser); // consume return type

    // 2. 函数名
    if (parser->current_token.type != TOK_IDENTIFIER) {
        parser_error(parser, "Expected function name after return type");
        return NULL;
    }
    char* func_name = COPY_STRING(parser->current_token.value);
    advance_token(parser); // consume function name

    // 3. (
    if (!expect_token(parser, TOK_LPAREN)) return NULL;

    // 4. 参数列表
    ASTNode* param_list = NULL;
    ASTNode* last_param = NULL;

    while (parser->current_token.type != TOK_RPAREN && parser->current_token.type != TOK_EOF) {
        // 类型 + 标识符
        if (parser->current_token.type != TOK_INT &&
            parser->current_token.type != TOK_CHAR_TYPE &&
            parser->current_token.type != TOK_VOID) {
            parser_error(parser, "Expected parameter type");
            return NULL;
        }

        char* param_type = COPY_STRING(parser->current_token.value);
        advance_token(parser);

        if (parser->current_token.type != TOK_IDENTIFIER) {
            parser_error(parser, "Expected parameter name");
            return NULL;
        }

        ASTNode* param = create_node(AST_DECLARATION);
        param->data.declaration.name = COPY_STRING(parser->current_token.value);
        param->data.declaration.type = param_type;
        param->data.declaration.initializer = NULL;
        advance_token(parser);

        // 连接参数链表
        if (!param_list) {
            param_list = param;
            last_param = param;
        } else {
            last_param->next = param;
            last_param = param;
        }

        if (parser->current_token.type == TOK_COMMA) {
            advance_token(parser); // consume ','
        } else {
            break;
        }
    }

    // 5. )
    if (!expect_token(parser, TOK_RPAREN)) return NULL;

    // 6. 函数体
    ASTNode* body = parse_block(parser); // parse_block() 应返回 AST_BLOCK

    // 7. 创建函数节点
    ASTNode* func_node = create_node(AST_FUNCTION);
    func_node->data.function.name = func_name;
    func_node->data.function.params = param_list;
    func_node->data.function.body = body;

    return func_node;
}

