#ifndef UTILS_H
#define UTILS_H

#include <stdio.h>

// 错误处理
void error(const char* msg, int line, int column);
void warning(const char* msg, int line, int column);

// 文件操作
char* read_file(const char* filename);
void write_file(const char* filename, const char* content);

// 调试
void debug_print(const char* format, ...);

#endif // UTILS_H