cmake_minimum_required(VERSION 3.10)

# 测试可执行文件
add_executable(test_lexer test_lexer.c)
target_link_libraries(test_lexer tinycompiler_lib)

add_executable(test_parser test_parser.c)
target_link_libraries(test_parser tinycompiler_lib)

# 添加测试
#add_test(NAME LexerTest COMMAND test_lexer)
#add_test(NAME ParserTest COMMAND test_parser)

# 示例编译测试
add_test(NAME CompileHello
    COMMAND tinycc ${CMAKE_CURRENT_SOURCE_DIR}/examples/hello.c -o hello.s -S
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR})

add_test(NAME CompileFactorial
    COMMAND tinycc ${CMAKE_CURRENT_SOURCE_DIR}/examples/factorial.c -o factorial.s -S
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR})