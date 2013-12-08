(function(){
	"use strict";

	var ptr = 0;
	// Memory map:
	var map = {};
	map.Hinit = ptr; ptr += 8*4;
	map.K = ptr; ptr += 64*4;
	map.H = ptr; ptr += 8*4;
	map.W = ptr; ptr += 64*4;
	var heap = new ArrayBuffer(4096);
	var u32 = new Uint32Array(heap);
	u32.set([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], map.Hinit>>2);
	u32.set([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
   	         0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
   	         0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	         0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	         0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	         0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	         0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	         0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2], map.K>>2);
console.log(map)
	function module(stdlib, foreign, heap) {
		"use asm";
		var u32 = new stdlib.Uint32Array(heap);
		var u8  = new stdlib.Uint8Array(heap);
		var fill = 0;
		var Hinit = foreign.Hinit|0;
		var H = foreign.H|0;
		var W = foreign.W|0;
		var K = foreign.K|0;
		function init() {
			var i = 0;
			for (i = 0; (i|0) < 8; i = (i+1)|0) {
				u32[(H + (i<<2))>>2] = u32[(Hinit + (i<<2))>>2]|0;
			}
			fill = 0;
			return;
		}
		function rightrotate(val, amount) {
			val = val | 0;
			amount = amount | 0;
			return (val << (32-amount)) | (val >>> amount) | 0;
		}
		function hashchunk() {
			// Message block is in w[0..15]
			var i = 0;
			var x = 0;
			var s0 = 0;
			var s1 = 0;
			var a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
			var ch = 0, temp1 = 0, maj = 0, temp2 = 0;
			// Swap endian:
			for (i = 0; (i|0) < 16; i = (i + 1)|0) {
				a = u8[(W+0)|0 + (i<<2)]|0;
				b = u8[(W+1)|0 + (i<<2)]|0;
				c = u8[(W+2)|0 + (i<<2)]|0;
				d = u8[(W+3)|0 + (i<<2)]|0;
				u8[(W+0)|0 + (i<<2)] = d;
				u8[(W+1)|0 + (i<<2)] = c;
				u8[(W+2)|0 + (i<<2)] = b;
				u8[(W+3)|0 + (i<<2)] = a;
			}
			// Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array:
			for (; (i|0) < 64; i = (i + 1)|0) {
				x = u32[(W + (((i - 15)|0)<<2))>>2]|0;
				s0 =        rightrotate(x, 7) | 0;
				s0 = (s0 ^ (rightrotate(x, 18)|0)) | 0;
				s0 = (s0 ^             (x>>>3)) | 0;
				x = u32[(W + (((i - 2)|0)<<2))>>2]|0;
				s1 =        rightrotate(x, 17) | 0;
				s1 = (s1 ^ (rightrotate(x, 19)|0)) | 0;
				s1 = (s1 ^             (x>>>10)) | 0;
				x = u32[(W + (((i - 16)|0)<<2))>>2]|0;
				x = (x + s0) | 0;
				x = (x + s1) | 0;
				x = (x + (u32[(W + (((i - 7)|0)<<2))>>2]|0)) | 0;
				u32[(W + (i<<2))>>2] = x;
			}
			// Initialize working variables to current hash value:
			a = u32[(H + (0<<2))>>2]|0;
			b = u32[(H + (1<<2))>>2]|0;
			c = u32[(H + (2<<2))>>2]|0;
			d = u32[(H + (3<<2))>>2]|0;
			e = u32[(H + (4<<2))>>2]|0;
			f = u32[(H + (5<<2))>>2]|0;
			g = u32[(H + (6<<2))>>2]|0;
			h = u32[(H + (7<<2))>>2]|0;

			// Compression function main loop:
			for (i = 0; (i|0) < 64; i = (i + 1)|0) {
				//console.log(toHex(a),toHex(b),toHex(c),toHex(d),toHex(e),toHex(f),toHex(g),toHex(h));
				s1 = ((rightrotate(e, 6)|0) ^ (rightrotate(e, 11)|0) ^ (rightrotate(e, 25)|0)) | 0;
				ch = ((e & f) ^ ((~e) & g)) | 0;
				temp1 = (h + s1)|0;
				temp1 = (temp1 + ch)|0;
				temp1 = (temp1 + (u32[(K+(i<<2))>>2]|0))|0;
				temp1 = (temp1 + (u32[(W+(i<<2))>>2]|0))|0;
				s0 =        rightrotate(a, 2) | 0;
				s0 = (s0 ^ (rightrotate(a, 13)|0)) | 0;
				s0 = (s0 ^ (rightrotate(a, 22)|0)) | 0;
				maj = (a & b) ^ (a & c) ^ (b & c);
				temp2 = (s0 + maj)|0;
				h = g;
				g = f;
				f = e;
				e = (d + temp1) | 0;
				d = c;
				c = b;
				b = a;
				a = (temp1 + temp2) | 0;
			}
			u32[(H + (0<<2))>>2] = ((u32[(H + (0<<2))>>2]|0) + a) | 0;
			u32[(H + (1<<2))>>2] = ((u32[(H + (1<<2))>>2]|0) + b) | 0;
			u32[(H + (2<<2))>>2] = ((u32[(H + (2<<2))>>2]|0) + c) | 0;
			u32[(H + (3<<2))>>2] = ((u32[(H + (3<<2))>>2]|0) + d) | 0;
			u32[(H + (4<<2))>>2] = ((u32[(H + (4<<2))>>2]|0) + e) | 0;
			u32[(H + (5<<2))>>2] = ((u32[(H + (5<<2))>>2]|0) + f) | 0;
			u32[(H + (6<<2))>>2] = ((u32[(H + (6<<2))>>2]|0) + g) | 0;
			u32[(H + (7<<2))>>2] = ((u32[(H + (7<<2))>>2]|0) + h) | 0;
			return;
		}
		function update(data, len) {
			data = data|0;
			len = len|0;
			var i = 0;
			for (i = 0; (i|0) < (len|0); i = (i + 1)|0) {
				u8[(W + fill)|0] = u8[(data + i)|0]|0;
				fill = (fill + 1)|0;
				if ((fill|0) == 64) {
					fill = 0;
					hashchunk();
				}
			}
			return;
		}
		function finish() {
			var i = 0;
			u8[(320+fill)|0] = 0x80;
			fill = (fill + 1)|0;
			while ((fill|0) != 64) {
				u8[(320+fill)|0] = 0;
				fill = (fill + 1)|0;
			}
			hashchunk();
			return;
		}
		return {init: init,
				update: update,
				finish: finish};
	}
	var asm = module(window, map, heap);
	var u8 = new window.Uint8Array(heap);
	var HEX = "0123456789abcdef";
	/*function toHex(i) {
		var j, ret = "";
		for (j = 0; j<8; j++) {
			ret = HEX[i&0xf] + ret;
			i >>= 4;
		}
		return ret;
	}*/
	function toHex(ary) {
		var i,j, ret = "";
		for (i = 0; i < ary.length; i+=4) {
			for (j = 3; j >= 0; j--) {
				ret += HEX[ary[i+j] >> 4] + HEX[ary[i+j] & 0xf];
			}
		}
		return ret;
	}
	window.sha256 = function(str) {
		asm.init();
		//u8.set(str, ptr);
		//asm.update(ptr, str.length);
		asm.finish();
		console.log(u32.subarray(map.W>>2, (map.W+64*4)>>2));
		return toHex(u8.subarray(map.H, map.H+32));
	};
})();