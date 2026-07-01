CC = gcc
CFLAGS = -Wall -Werror -Wextra -std=c11
BUILD_DIR = ../../build
LIBS = ../data_libs/data_io.c ../data_libs/data_stat.c

all:
	mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) data_module_entry.c $(LIBS) -o $(BUILD_DIR)/Quest_1

clean:
	rm -f $(BUILD_DIR)/Quest_1

rebuild: clean all
