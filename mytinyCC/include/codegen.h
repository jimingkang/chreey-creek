
#ifndef CODEGEN_H
#define CODEGEN_H

#include "parser.h"
#include <stdio.h>

// 简单符号表项
typedef struct SymbolEntry {
    char* name;
    int offset;
    struct SymbolEntry* next;
} SymbolEntry;

// 代码生成器状态
typedef struct {
    FILE* output;
    int label_count;
    SymbolEntry* symbol_table;
    int stack_offset;
} CodeGenerator;
// 函数声明
// 函数声明


CodeGenerator* codegen_init(FILE* output);
void codegen_free(CodeGenerator* codegen);
void generate_code(CodeGenerator* codegen, ASTNode* node);
void generate_assembly(CodeGenerator* codegen, ASTNode* ast);

// 辅助函数声明
static void generate_expression(CodeGenerator* codegen, ASTNode* node);
static void generate_statement(CodeGenerator* codegen, ASTNode* node);
static void generate_declaration(CodeGenerator* codegen, ASTNode* node);
static void generate_function(CodeGenerator* codegen, ASTNode* node);
static int get_new_label(CodeGenerator* codegen);
static void emit(CodeGenerator* codegen, const char* format, ...);
static int get_variable_offset(CodeGenerator* codegen, const char* name);
static void add_variable(CodeGenerator* codegen, const char* name, int offset);

#endif // CODEGEN_H