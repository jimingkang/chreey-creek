CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g
LEMON = lemon

SOURCES = main.c lexer.c ast.c parser.c
OBJECTS = $(SOURCES:.c=.o)
TARGET = calculator

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $@ $^

parser.c parser.h: parser.y
	$(LEMON) parser.y

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJECTS) $(TARGET) parser.c parser.h parser.out

test: $(TARGET)
	echo "x = 10 + 20 * 3;" | ./$(TARGET)