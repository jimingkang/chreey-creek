%include {
    #include <stdio.h>
    #include <stdlib.h>
    #include <string.h>
    #include "ast.h"
    #include "lexer.h"
}


%token_type {Token}
%default_type {ASTNode*}

%extra_argument { ParserContext *ctx }
%include {
  #define ParseARG_SDECL ParserContext *ctx;
  #define ParseARG_PDECL , ParserContext *ctx
  #define ParseARG_PARAM , ctx
  #define ParseARG_FETCH  /* empty */
  #define ParseARG_STORE  /* empty */
}


%type program {ASTNode*}
%type statement_list {ASTNode*}
%type statement {ASTNode*}
%type expression {ASTNode*}
%type term {ASTNode*}
%type factor {ASTNode*}

%left PLUS MINUS.
%left MULTIPLY DIVIDE.
%right UMINUS.
%nonassoc IF.
%nonassoc ELSE.



%start_symbol program

%syntax_error {
    fprintf(stderr, "Syntax error at line %d, column %d\n", 
            TOKEN.line, TOKEN.column);
}

%parse_failure {
    fprintf(stderr, "Parse failure\n");
}

%parse_accept {
    printf("Parse successful\n");
}


program(P) ::= statement_list(S). {
    P = S;
}

statement_list(L) ::= statement_list(L1) statement(S). {
    L = ast_create_block();
    ast_add_statement(L, L1);
    ast_add_statement(L, S);
}

statement_list(L) ::= statement(S). {
    L = ast_create_block();
    ast_add_statement(L, S);
}


statement(S) ::= IDENTIFIER(I) ASSIGN expression(E) SEMICOLON. {
    S = ast_create_assignment(I.value, E);
}

statement(S) ::= IF LPAREN expression(E) RPAREN statement(S1). {
    S = ast_create_if_stmt(E, S1, NULL);
}

statement(S) ::= IF LPAREN expression(E) RPAREN statement(S1) ELSE statement(S2). {
    S = ast_create_if_stmt(E, S1, S2);
}

statement(S) ::= WHILE LPAREN expression(E) RPAREN statement(S1). {
    S = ast_create_while_stmt(E, S1);
}

statement(S) ::= LBRACE statement_list(L) RBRACE. {
    S = L;
}

statement(S) ::= expression(E) SEMICOLON. {
    S = E;
}


expression(E) ::= expression(E1) PLUS term(T). {
    E = ast_create_binary_op(E1, '+', T);
}

expression(E) ::= expression(E1) MINUS term(T). {
    E = ast_create_binary_op(E1, '-', T);
}

expression(E) ::= term(T). {
    E = T;
}


term(T) ::= term(T1) MULTIPLY factor(F). {
    T = ast_create_binary_op(T1, '*', F);
}

term(T) ::= term(T1) DIVIDE factor(F). {
    T = ast_create_binary_op(T1, '/', F);
}

term(T) ::= factor(F). {
    T = F;
}

factor(F) ::= NUMBER(N). {
    F = ast_create_number(N.data.int_val);
}

factor(F) ::= IDENTIFIER(I). {
    F = ast_create_identifier(I.value);
}

factor(F) ::= LPAREN expression(E) RPAREN. {
    F = E;
}

factor(F) ::= MINUS factor(F1). [UMINUS] {
    F = ast_create_unary_op('-', F1);
}