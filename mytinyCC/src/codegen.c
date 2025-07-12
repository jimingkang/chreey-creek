#include "parser.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include "codegen.h"





static SymbolEntry* symbol_list = NULL;

// 初始化代码生成器
CodeGenerator* codegen_init(FILE* output) {
    CodeGenerator* codegen = malloc(sizeof(CodeGenerator));
    if (!codegen) {
        fprintf(stderr, "Error: Memory allocation failed for CodeGenerator\n");
        return NULL;
    }
    
    codegen->output = output;
    codegen->label_count = 0;
    codegen->symbol_table = NULL;
    codegen->stack_offset = 0;
    
    return codegen;
}

// 释放代码生成器
void codegen_free(CodeGenerator* codegen) {
    if (codegen) {
        // 释放符号表
        SymbolEntry* current = symbol_list;
        while (current) {
            SymbolEntry* next = current->next;
            free(current->name);
            free(current);
            current = next;
        }
        symbol_list = NULL;
        free(codegen);
    }
}

// 生成新的标签
static int get_new_label(CodeGenerator* codegen) {
    return codegen->label_count++;
}

// 输出汇编代码
static void emit(CodeGenerator* codegen, const char* format, ...) {
    va_list args;
    va_start(args, format);
    vfprintf(codegen->output, format, args);
    va_end(args);
    fprintf(codegen->output, "\n");
}

// 获取变量在栈中的偏移
static int get_variable_offset(CodeGenerator* codegen, const char* name) {
    SymbolEntry* current = symbol_list;
    while (current) {
        if (strcmp(current->name, name) == 0) {
            return current->offset;
        }
        current = current->next;
    }
    return 0; // 未找到变量
}

// 添加变量到符号表
static void add_variable(CodeGenerator* codegen, const char* name, int offset) {
    SymbolEntry* entry = malloc(sizeof(SymbolEntry));
    entry->name = strdup(name);
    entry->offset = offset;
    entry->next = symbol_list;
    symbol_list = entry;
}

// 生成表达式代码
static void generate_expression(CodeGenerator* codegen, ASTNode* node) {
    if (!node) return;
    
    switch (node->type) {
        case AST_LITERAL:
            // 处理字面量
            if (node->data.literal.value_type == TOK_NUMBER) {
                emit(codegen, "    movl $%s, %%eax", node->data.literal.value);
            } else if (node->data.literal.value_type == TOK_STRING) {
                // 字符串处理需要更复杂的逻辑
                emit(codegen, "    movl $str_%d, %%eax", get_new_label(codegen));
            }
            break;
            
        case AST_IDENTIFIER:
            // 从栈中加载变量
            {
                int offset = get_variable_offset(codegen, node->data.identifier);
                emit(codegen, "    movl %d(%%rbp), %%eax", offset);
            }
            break;
            
        case AST_BINARY_OP:
            // 生成左操作数
            generate_expression(codegen, node->data.binary.left);
            emit(codegen, "    pushl %%eax");
            
            // 生成右操作数
            generate_expression(codegen, node->data.binary.right);
            emit(codegen, "    movl %%eax, %%ebx");
            emit(codegen, "    popl %%eax");
            
            // 执行二元操作
            if (strcmp(node->data.binary.operator, "+") == 0) {
                emit(codegen, "    addl %%ebx, %%eax");
            } else if (strcmp(node->data.binary.operator, "-") == 0) {
                emit(codegen, "    subl %%ebx, %%eax");
            } else if (strcmp(node->data.binary.operator, "*") == 0) {
                emit(codegen, "    imull %%ebx, %%eax");
            } else if (strcmp(node->data.binary.operator, "/") == 0) {
                emit(codegen, "    cltd");
                emit(codegen, "    idivl %%ebx");
            } else if (strcmp(node->data.binary.operator, "<") == 0) {
                emit(codegen, "    cmpl %%ebx, %%eax");
                emit(codegen, "    setl %%al");
                emit(codegen, "    movzbl %%al, %%eax");
            } else if (strcmp(node->data.binary.operator, ">") == 0) {
                emit(codegen, "    cmpl %%ebx, %%eax");
                emit(codegen, "    setg %%al");
                emit(codegen, "    movzbl %%al, %%eax");
            } else if (strcmp(node->data.binary.operator, "==") == 0) {
                emit(codegen, "    cmpl %%ebx, %%eax");
                emit(codegen, "    sete %%al");
                emit(codegen, "    movzbl %%al, %%eax");
            } else if (strcmp(node->data.binary.operator, "=") == 0) {
                // 赋值操作
                generate_expression(codegen, node->data.binary.right);
                if (node->data.binary.left->type == AST_IDENTIFIER) {
                    int offset = get_variable_offset(codegen, node->data.binary.left->data.identifier);
                    emit(codegen, "    movl %%eax, %d(%%rbp)", offset);
                }
            }
            break;
            
        case AST_UNARY_OP:
            generate_expression(codegen, node->data.unary.operand);
            if (strcmp(node->data.unary.operator, "-") == 0) {
                emit(codegen, "    negl %%eax");
            } else if (strcmp(node->data.unary.operator, "!") == 0) {
                emit(codegen, "    cmpl $0, %%eax");
                emit(codegen, "    sete %%al");
                emit(codegen, "    movzbl %%al, %%eax");
            }
            break;
            
        case AST_CALL:
            // 简单的函数调用实现
            // 生成参数（如果有）
            if (node->data.call.args) {
                generate_expression(codegen, node->data.call.args);
                emit(codegen, "    pushl %%eax");
            }
            
            // 调用函数
            emit(codegen, "    call %s", node->data.call.name);
            
            // 清理栈（如果有参数）
            if (node->data.call.args) {
                emit(codegen, "    addl $4, %%esp");
            }
            break;
            
        default:
            break;
    }
}

// 生成语句代码
static void generate_statement(CodeGenerator* codegen, ASTNode* node) {
    if (!node) return;
    
    switch (node->type) {
        case AST_BLOCK:
            // 块语句 - 处理语句列表
            {
                ASTNode* current = node->left;
                while (current) {
                    generate_code(codegen, current);
                    current = current->next;
                }
            }
            break;
            
        case AST_IF:
            {
                int else_label = get_new_label(codegen);
                int end_label = get_new_label(codegen);
                
                // 生成条件表达式
                generate_expression(codegen, node->data.if_stmt.condition);
                emit(codegen, "    cmpl $0, %%eax");
                emit(codegen, "    je .L%d", else_label);
                
                // 生成then分支
                generate_code(codegen, node->data.if_stmt.then_branch);
                emit(codegen, "    jmp .L%d", end_label);
                
                // else分支
                emit(codegen, ".L%d:", else_label);
                if (node->data.if_stmt.else_branch) {
                    generate_code(codegen, node->data.if_stmt.else_branch);
                }
                
                emit(codegen, ".L%d:", end_label);
            }
            break;
            
        case AST_WHILE:
            {
                int loop_label = get_new_label(codegen);
                int end_label = get_new_label(codegen);
                
                emit(codegen, ".L%d:", loop_label);
                // 生成条件表达式
                generate_expression(codegen, node->data.while_stmt.condition);
                emit(codegen, "    cmpl $0, %%eax");
                emit(codegen, "    je .L%d", end_label);
                
                // 生成循环体
                generate_code(codegen, node->data.while_stmt.body);
                emit(codegen, "    jmp .L%d", loop_label);
                
                emit(codegen, ".L%d:", end_label);
            }
            break;
            
        case AST_FOR:
            {
                int loop_label = get_new_label(codegen);
                int end_label = get_new_label(codegen);
                
                // 初始化
                if (node->data.for_stmt.init) {
                    generate_code(codegen, node->data.for_stmt.init);
                }
                
                emit(codegen, ".L%d:", loop_label);
                
                // 条件检查
                if (node->data.for_stmt.condition) {
                    generate_expression(codegen, node->data.for_stmt.condition);
                    emit(codegen, "    cmpl $0, %%eax");
                    emit(codegen, "    je .L%d", end_label);
                }
                
                // 循环体
                if (node->data.for_stmt.body) {
                    generate_code(codegen, node->data.for_stmt.body);
                }
                
                // 更新
                if (node->data.for_stmt.update) {
                    generate_expression(codegen, node->data.for_stmt.update);
                }
                
                emit(codegen, "    jmp .L%d", loop_label);
                emit(codegen, ".L%d:", end_label);
            }
            break;
            
        case AST_RETURN:
            if (node->left) {
                generate_expression(codegen, node->left);
            }
            emit(codegen, "    leave");
            emit(codegen, "    ret");
            break;
            
        case AST_EXPRESSION:
            generate_expression(codegen, node);
            break;
            
        default:
            generate_expression(codegen, node);
            break;
    }
}

// 生成变量声明代码
static void generate_declaration(CodeGenerator* codegen, ASTNode* node) {
    if (!node) return;
    
    switch (node->type) {
        case AST_DECLARATION:
            // 为变量分配栈空间
            codegen->stack_offset -= 4; // 假设int为4字节
            add_variable(codegen, node->data.declaration.name, codegen->stack_offset);
            
            // 如果有初始化表达式
            if (node->data.declaration.initializer) {
                generate_expression(codegen, node->data.declaration.initializer);
                emit(codegen, "    movl %%eax, %d(%%rbp)", codegen->stack_offset);
            }
            break;
    }
}

// 生成函数代码
static void generate_function(CodeGenerator* codegen, ASTNode* node) {
    if (!node || node->type != AST_FUNCTION) return;
    
    // 函数标签
    emit(codegen, ".globl %s", node->data.function.name);
    emit(codegen, "%s:", node->data.function.name);
    
    // 函数序言
    emit(codegen, "    pushq %%rbp");
    emit(codegen, "    movq %%rsp, %%rbp");
    
    // 重置栈偏移
    codegen->stack_offset = 0;
    
    // 处理参数
    if (node->data.function.params) {
        // 参数处理逻辑
        ASTNode* param = node->data.function.params;
        int param_offset = 8; // 参数从rbp+8开始
        while (param) {
            if (param->type == AST_DECLARATION) {
                add_variable(codegen, param->data.declaration.name, param_offset);
                param_offset += 4;
            }
            param = param->next;
        }
    }
    
    // 生成函数体
    if (node->data.function.body) {
        generate_code(codegen, node->data.function.body);
    }
    
    // 函数结尾（如果没有显式return）
    emit(codegen, "    leave");
    emit(codegen, "    ret");
}

// 主要的代码生成函数
void generate_code(CodeGenerator* codegen, ASTNode* node) {
    if (!node || !codegen) return;
    
    switch (node->type) {
        case AST_PROGRAM:
            // 程序节点，递归处理子节点
            {
                ASTNode* current = node->left;
                while (current) {
                    generate_code(codegen, current);
                    current = current->next;
                }
            }
            break;
            
        case AST_FUNCTION:
            generate_function(codegen, node);
            break;
            
        case AST_DECLARATION:
            generate_declaration(codegen, node);
            break;
            
        default:
            generate_statement(codegen, node);
            break;
    }
}

// 生成完整的汇编代码
void generate_assembly(CodeGenerator* codegen, ASTNode* ast) {
    if (!codegen || !ast) return;
    
    // 生成汇编头部
    emit(codegen, ".section .text");
    
    // 生成代码
    generate_code(codegen, ast);
    
    // 如果需要，可以添加数据段
    emit(codegen, ".section .data");
    // 这里可以添加字符串字面量等
}