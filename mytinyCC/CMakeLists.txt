# ==============================================================================
# 根目录 CMakeLists.txt
# ==============================================================================
cmake_minimum_required(VERSION 3.10)
project(TinyCompiler VERSION 1.0.0 LANGUAGES C)

# 设置C标准
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# 设置编译选项
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -g")
set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -O0 -DDEBUG")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -O3 -DNDEBUG")

# 设置默认构建类型
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

# 包含目录
include_directories(include)

# 源文件
set(SOURCES
    src/lexer.c
    src/parser.c
    src/codegen.c
    src/utils.c
)

# 头文件
set(HEADERS
    include/lexer.h
    include/parser.h
    include/codegen.h
    include/utils.h
)

# 创建静态库
add_library(tinycompiler_lib STATIC ${SOURCES} ${HEADERS})

# 创建可执行文件
add_executable(tinycc src/main.c)
target_link_libraries(tinycc tinycompiler_lib)

# 安装规则
install(TARGETS tinycc DESTINATION bin)
install(FILES ${HEADERS} DESTINATION include/tinycompiler)

# 启用测试
#enable_testing()
#add_subdirectory(tests)

# 打印构建信息
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C compiler: ${CMAKE_C_COMPILER}")
message(STATUS "C flags: ${CMAKE_C_FLAGS}")