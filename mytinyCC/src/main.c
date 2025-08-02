#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "lexer.h"
#include "parser.h"
#include "codegen.h"
#include "utils.h"

void print_usage(const char* program_name) {
    printf("Usage: %s [options] <input_file>\n", program_name);
    printf("Options:\n");
    printf("  -o <output>  Specify output file (default: a.out)\n");
    printf("  -S           Generate assembly only\n");
    printf("  -v           Verbose output\n");
    printf("  -h           Show this help\n");
}

int main(int argc, char* argv[]) {
    char* input_file = NULL;
    char* output_file = "a.out";
    int generate_asm_only = 0;
    int verbose = 0;
    
    // 解析命令行参数
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-o") == 0 && i + 1 < argc) {
            output_file = argv[++i];
        } else if (strcmp(argv[i], "-S") == 0) {
            generate_asm_only = 1;
        } else if (strcmp(argv[i], "-v") == 0) {
            verbose = 1;
        } else if (strcmp(argv[i], "-h") == 0) {
            print_usage(argv[0]);
            return 0;
        } else if (argv[i][0] != '-') {
            input_file = argv[i];
        } else {
            fprintf(stderr, "Unknown option: %s\n", argv[i]);
            print_usage(argv[0]);
            return 1;
        }
    }
    
    if (!input_file) {
        fprintf(stderr, "No input file specified\n");
        print_usage(argv[0]);
        return 1;
    }
    
    if (verbose) {
        printf("Compiling: %s\n", input_file);
        printf("Output: %s\n", output_file);
    }
    
    // 读取源代码
    /* */
    char* source = read_file(input_file);
    if (!source) {
        fprintf(stderr, "Failed to read file: %s\n", input_file);
        return 1;
    }



    
    // 词法分析
    Lexer* lexer = lexer_init(source);
    if (!lexer) {
        fprintf(stderr, "Failed to initialize lexer\n");
        free(source);
        return 1;
    }
    
    if (verbose) {
        printf("Lexical analysis completed\n");
    }
    
    // 语法分析
    Parser* parser = parser_init(source);
    ASTNode* ast = parse_program(parser);
    
    if (parser->error_count > 0) {
        fprintf(stderr, "Parsing failed with %d errors\n", parser->error_count);
        parser_free(parser);
        lexer_free(lexer);
        free(source);
        return 1;
    }
    
    if (verbose) {
        printf("Parsing completed\n");
        printf("AST:\n");
      //  print_ast(ast, 0);
    }
    
    // 代码生成
    FILE* output = fopen(output_file, "w");
    if (!output) {
        fprintf(stderr, "Failed to open output file: %s\n", output_file);
        parser_free(parser);
        lexer_free(lexer);
        free(source);
        return 1;
    }
    
    CodeGenerator* codegen = codegen_init(output);
    generate_assembly(codegen, ast);
    
    if (verbose) {
        printf("Code generation completed\n");
    }
    
    // 清理
    fclose(output);
    codegen_free(codegen);
    parser_free(parser);
    lexer_free(lexer);
    free(source);
    
    printf("Compilation successful: %s\n", output_file);
    return 0;
}