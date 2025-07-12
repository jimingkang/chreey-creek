#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "lexer.h"
#include "parser.h"
#include "ast.h"

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <input_file>\n", argv[0]);
        return 1;
    }
    
    // 读取输入文件
    FILE *file = fopen(argv[1], "r");
    if (!file) {
        perror("Failed to open file");
        return 1;
    }
    
    fseek(file, 0, SEEK_END);
    long file_size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    char *input = malloc(file_size + 1);
    fread(input, 1, file_size, file);
    input[file_size] = '\0';
    fclose(file);
    
    // 创建词法分析器
    Lexer *lexer = lexer_create(input);
    
    // 创建解析器
    void *parser = ParseAlloc(malloc);
    if (!parser) {
    fprintf(stderr, "Parser alloc failed!\n");
    exit(1);
}
    
    // 词法分析和语法分析
    Token token;
    ParserContext ctx = {
        .root = NULL,
        .error_count = 0,
        //.source_file = file
    };
    do {
        token = lexer_next_token(lexer);
        
        printf("Token: %s", token_type_to_string(token.type));
        if (token.value) {
            printf(" (%s)", token.value);
        }
        printf(" at line %d, column %d\n", token.line, token.column);
        
        
        // 将token传递给解析器
        Parse(parser, token.type, token,&ctx);
        
        
    } while (token.type != TOKEN_EOF);
    
    // 完成解析
    Parse(parser, 0, token, &ctx);
    
    // 清理资源
    ParseFree(parser, free);
    lexer_destroy(lexer);
    free(input);
    
    return 0;
}