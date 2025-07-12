#include "utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>

void error(const char* msg, int line, int column) {
    fprintf(stderr, "Error at line %d, column %d: %s\n", line, column, msg);
}

void warning(const char* msg, int line, int column) {
    fprintf(stderr, "Warning at line %d, column %d: %s\n", line, column, msg);
}

char* read_file(const char* filename) {
    FILE* file = fopen(filename, "r");
    if (!file) {
        return NULL;
    }
    
    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    char* content = malloc(size + 1);
    if (!content) {
        fclose(file);
        return NULL;
    }
    
    fread(content, 1, size, file);
    content[size] = '\0';
    fclose(file);
    
    return content;
}

void write_file(const char* filename, const char* content) {
    FILE* file = fopen(filename, "w");
    if (!file) {
        fprintf(stderr, "Failed to open file for writing: %s\n", filename);
        return;
    }
    
    fputs(content, file);
    fclose(file);
}

void debug_print(const char* format, ...) {
    #ifdef DEBUG
    va_list args;
    va_start(args, format);
    printf("[DEBUG] ");
    vprintf(format, args);
    va_end(args);
    #endif
}
