

CC := emcc
OPT ?= -O1
CFLAGS := $(OPT)
SRCS := $(addprefix build/,fec.c)

build/fec.c.js: build/fec.o build
	$(CC) $(CFLAGS) $< -s "EXPORTED_FUNCTIONS=['_fec_new','_fec_free','_fec_encode','_fec_decode']" -o $@

build:
	mkdir build

build/%.d: src/%.c build
	$(CC) -M $< -o $@
build/%.o: src/%.c build
	$(CC) $(CFLAGS) -c $< -o $@

.PHONY:clean
clean:
	rm -rf build */*~

-include $(SRCS:.c=.d)
