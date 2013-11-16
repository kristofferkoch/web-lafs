
OPT ?= -O1

fec.c.js: fec.c fec.h
	emcc $(OPT) fec.c -o fec.c.js -s "EXPORTED_FUNCTIONS=['_fec_new','_fec_free','_fec_encode','_fec_decode']"

.PHONY:clean
clean:
	rm *.c.js *.c.map
