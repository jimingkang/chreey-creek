cmake_minimum_required(VERSION 3.10)
project(calculator C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -g")

# Lemon parser generator
find_program(LEMON_EXECUTABLE lemon REQUIRED)

# Trigger lemon to generate parser.c and parser.h
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/parser.c ${CMAKE_CURRENT_BINARY_DIR}/parser.h
    COMMAND ${LEMON_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/parser.y
    COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/parser.c ${CMAKE_CURRENT_BINARY_DIR}/parser.c
    COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_CURRENT_SOURCE_DIR}/parser.h ${CMAKE_CURRENT_BINARY_DIR}/parser.h
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/parser.y ${CMAKE_CURRENT_SOURCE_DIR}/lempar.c
    COMMENT "Generating parser.c and parser.h from parser.y"
)

# Add the generated parser files to the project
set(GENERATED_PARSER ${CMAKE_CURRENT_BINARY_DIR}/parser.c ${CMAKE_CURRENT_BINARY_DIR}/parser.h)

# Source files
set(SOURCES
    main.c
    lexer.c
    #lempar.c
    ast.c
    ${GENERATED_PARSER}
    parser.c
)

# Include current and binary dir for parser.h
include_directories(${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR})

# Add executable
add_executable(calculator ${SOURCES})

# Optional: test target
add_custom_target(test
    COMMAND echo "x = 10 + 20 * 3;" | $<TARGET_FILE:calculator>
    DEPENDS calculator
    COMMENT "Running test with sample input"
)