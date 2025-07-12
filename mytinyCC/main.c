// 模拟 TinyCC 的语法解释工具：递归下降解析 + 简易解释器（支持函数调用）
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

// ---------------- 词法分析器 ----------------
typedef enum {
    TOKEN_EOF,
    TOKEN_INT,
    TOKEN_RETURN,
    TOKEN_IDENTIFIER,
    TOKEN_NUMBER,
    TOKEN_SEMI,
    TOKEN_LPAREN,
    TOKEN_RPAREN,
    TOKEN_LBRACE,
    TOKEN_RBRACE,
    TOKEN_PLUS
} TokenType;

typedef struct {
    TokenType type;
    char lexeme[64];
    int value;
} Token;

const char *src;
Token current_token;

void next_token() {
    while (*src && isspace(*src)) src++;
    if (isdigit(*src)) {
        int val = 0;
        while (isdigit(*src)) val = val * 10 + (*src++ - '0');
        current_token.type = TOKEN_NUMBER;
        current_token.value = val;
        return;
    }
    if (isalpha(*src)) {
        char buf[64]; int len = 0;
        while (isalnum(*src)) buf[len++] = *src++;
        buf[len] = '\0';
        if (strcmp(buf, "int") == 0) current_token.type = TOKEN_INT;
        else if (strcmp(buf, "return") == 0) current_token.type = TOKEN_RETURN;
        else {
            current_token.type = TOKEN_IDENTIFIER;
            strcpy(current_token.lexeme, buf);
        }
        return;
    }
    switch (*src) {
        case ';': current_token.type = TOKEN_SEMI; src++; return;
        case '(': current_token.type = TOKEN_LPAREN; src++; return;
        case ')': current_token.type = TOKEN_RPAREN; src++; return;
        case '{': current_token.type = TOKEN_LBRACE; src++; return;
        case '}': current_token.type = TOKEN_RBRACE; src++; return;
        case '+': current_token.type = TOKEN_PLUS; src++; return;
        case '\0': current_token.type = TOKEN_EOF; return;
        default:
            printf("[LEX ERROR] Unknown char: %c\n", *src);
            exit(1);
    }
}

// ---------------- AST ----------------
typedef enum { AST_NUM, AST_ADD, AST_RETURN, AST_CALL } ASTType;

typedef struct ASTNode {
    ASTType type;
    union {
        int value;
        struct { struct ASTNode *left, *right; } add;
        struct ASTNode *expr;
        struct { char name[64]; } call;
    };
} ASTNode;

ASTNode *make_num(int val) {
    ASTNode *n = malloc(sizeof(ASTNode));
    n->type = AST_NUM; n->value = val; return n;
}
ASTNode *make_add(ASTNode *l, ASTNode *r) {
    ASTNode *n = malloc(sizeof(ASTNode));
    n->type = AST_ADD; n->add.left = l; n->add.right = r; return n;
}
ASTNode *make_return(ASTNode *expr) {
    ASTNode *n = malloc(sizeof(ASTNode));
    n->type = AST_RETURN; n->expr = expr; return n;
}
ASTNode *make_call(const char *name) {
    ASTNode *n = malloc(sizeof(ASTNode));
    n->type = AST_CALL;
    strncpy(n->call.name, name, 63);
    return n;
}

// ---------------- 函数定义注册 ----------------
typedef struct {
    char name[64];
    int value; // 固定返回值
} Function;

Function function_table[] = {
    {"foo", 42},
    {"bar", 100},
    {NULL, 0}
};

int call_function(const char *name) {
    for (int i = 0; function_table[i].name; i++) {
        if (strcmp(name, function_table[i].name) == 0)
            return function_table[i].value;
    }
    printf("[RUNTIME ERROR] Unknown function: %s\n", name);
    exit(1);
}

// ---------------- 语法分析器 ----------------
ASTNode *parse_expr();
ASTNode *parse_term() {
    if (current_token.type == TOKEN_NUMBER) {
        ASTNode *n = make_num(current_token.value);
        next_token(); return n;
    }
    if (current_token.type == TOKEN_IDENTIFIER) {
        char fname[64];
        strcpy(fname, current_token.lexeme);
        next_token();
        if (current_token.type == TOKEN_LPAREN) {
            next_token();
            if (current_token.type != TOKEN_RPAREN) {
                printf("[PARSE ERROR] Expected ')' after function call\n"); exit(1);
            }
            next_token();
            return make_call(fname);
        }
    }
    printf("[PARSE ERROR] Invalid term\n"); exit(1);
}

ASTNode *parse_expr() {
    ASTNode *node = parse_term();
    while (current_token.type == TOKEN_PLUS) {
        next_token();
        ASTNode *rhs = parse_term();
        node = make_add(node, rhs);
    }
    return node;
}

ASTNode *parse_stmt() {
    if (current_token.type == TOKEN_RETURN) {
        next_token();
        ASTNode *expr = parse_expr();
        if (current_token.type != TOKEN_SEMI) {
            printf("[PARSE ERROR] Expected ';'\n"); exit(1);
        }
        next_token();
        return make_return(expr);
    }
    printf("[PARSE ERROR] Expected 'return'\n"); exit(1);
}

ASTNode *parse_function() {
    if (current_token.type != TOKEN_INT) {
        printf("[PARSE ERROR] Expected 'int'\n"); exit(1);
    }
    next_token();
    if (current_token.type != TOKEN_IDENTIFIER) {
        printf("[PARSE ERROR] Expected function name\n"); exit(1);
    }
    next_token();
    if (current_token.type != TOKEN_LPAREN) {
        printf("[PARSE ERROR] Expected '('\n"); exit(1);
    }
    next_token();
    if (current_token.type != TOKEN_RPAREN) {
        printf("[PARSE ERROR] Expected ')'\n"); exit(1);
    }
    next_token();
    if (current_token.type != TOKEN_LBRACE) {
        printf("[PARSE ERROR] Expected '{'\n"); exit(1);
    }
    next_token();
    ASTNode *stmt = parse_stmt();
    if (current_token.type != TOKEN_RBRACE) {
        printf("[PARSE ERROR] Expected '}'\n"); exit(1);
    }
    return stmt;
}

// ---------------- 解释器 ----------------
int eval(ASTNode *node) {
    switch (node->type) {
        case AST_NUM: return node->value;
        case AST_ADD: return eval(node->add.left) + eval(node->add.right);
        case AST_RETURN: return eval(node->expr);
        case AST_CALL: return call_function(node->call.name);
        default: return 0;
    }
}

void free_ast(ASTNode *n) {
    if (!n) return;
    switch (n->type) {
        case AST_ADD:
            free_ast(n->add.left);
            free_ast(n->add.right);
            break;
        case AST_RETURN:
            free_ast(n->expr);
            break;
        default: break;
    }
    free(n);
}

// ---------------- main ----------------
int main(int argc, char *argv[]) {
    char input[512];
    printf("Enter C function (e.g. int main() { return foo() + 1; }):\n> ");
    fgets(input, sizeof(input), stdin);
    src = input;
    next_token();
    ASTNode *fn = parse_function();
    int result = eval(fn);
    printf("Execution result: %d\n", result);
    free_ast(fn);
    return 0;
}
