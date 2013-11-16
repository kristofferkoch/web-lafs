var fec = (function() {
    "use strict";
    var fec_new = Module.cwrap('fec_new', 'number', ['number', 'number']);
    var fec_free = Module.cwrap('fec_free', null, ['number']);
    var fec_encode = Module.cwrap('fec_encode', null, ['number', 'number', 'number', 'number', 'number', 'number']);
    var fec_decode = Module.cwrap('fec_decode', null, ['number', 'number', 'number', 'number', 'number']);
    return function(k, m) {
	var fec = fec_new(k, m);
	var self = {};
	self.encode = function(data, wanted_blocks) {
	    var i;
	    var pktsz = Math.ceil(data.length / k);
	    var fullsz = k*pktsz;
	    var checkblocks = k-m;
	    if (typeof wanted_blocks === "undefined") {
		// By default, we want all the extra blocks
		wanted_blocks = [];
		for(i = k; i < m; i++) {
		    wanted_blocks.push(i);
		}
	    }
	    var dataptr = Module._malloc(k * pktsz);
	    Module.HEAPU8.set(data, dataptr);
	    for (i = data.length; i < fullsz; i++) { // Zero the rest of the data
		Module.HEAPU8[i+dataptr] = 0;
	    }

	    // Make a list of pointers into dataptr:
	    var inpkts = Module._malloc(k*4);
	    for (i = 0; i < k; i++) {
		Module.HEAPU32[inpkts/4 + i] = dataptr + pktsz*i;
	    }

	    // Allocate mem for return, and make a list of pointers into it:
	    var fecs = Module._malloc(wanted_blocks.length * pktsz);
	    var fecslist = Module._malloc(wanted_blocks.length*4);
	    for (i = 0; i < wanted_blocks.length; i++) {
		Module.HEAPU32[fecslist/4 + i] = fecs + pktsz*i;
	    }
	    
	    // Allocate list of wanted blocks
	    var block_nums = Module._malloc(wanted_blocks.length*4);
	    for (i = 0; i < wanted_blocks.length; i++) {
		Module.HEAPU32[block_nums/4 + i] = wanted_blocks[i];
	    }

	    // Call compiled c-code
	    fec_encode(fec, inpkts, fecslist, block_nums, wanted_blocks.length, pktsz);
	    
	    // Copy data to return:
	    var ret = [];
	    var copy, start, end;
	    for (i = 0; i < wanted_blocks.length; i++) {
		start = Module.HEAPU32[fecslist/4 + i];
		end   = start + pktsz;
		copy = new Uint8Array(pktsz);
		copy.set(Module.HEAPU8.subarray(start, end));
		ret.push(copy);
	    }
	    // Free memory from "heap"
	    Module._free(block_nums);
	    Module._free(fecslist);
	    Module._free(fecs);
	    Module._free(inpkts);
	    Module._free(dataptr);
	    return ret;
	}
	function sort_packets(packets) {
	    var i, j;
	    var packets_sorted = [];
	    var packets_num = [];
	    var rest = [];
	    for (i = 0; i < k; i++) {
		if (packets[i][0] < k) {
		    packets_sorted[packets[i][0]] = packets[i][1];
		    packets_num[packets[i][0]] = packets[i][0];
		}
		else {
		    rest.push(packets[i]);
		}
	    }
	    var originals = packets_sorted.length;
	    j = 0;
	    for (i = 0; j < rest.length; i++) {
		if (typeof packets_sorted[i] === "undefined") {
		    packets_sorted[i] = rest[j][1];
		    packets_num[i] = rest[j][0];
		    j++;
		}
	    }
	    var ret = {};
	    ret.originals = originals;
	    ret.content   = packets_sorted;
	    ret.num       = packets_num;
	    return ret;
	}
	self.decode = function(packets) {
	    var i;
	    var packets = sort_packets(packets);
	    var numoutpkts = 0;
	    for (i = 0; i < k; i++) {
		if (packets.num[i] >= k) {
		    numoutpkts += 1;
		}
	    }
	    if (numoutpkts == 0) {
		return [];
	    }
	    var pktsz = packets.content[0].length;
	    var indata = Module._malloc(pktsz*k);
	    var inpkts = Module._malloc(k*4);
	    var index = Module._malloc(k*4);
	    for (i = 0; i < k; i++) {
		Module.HEAPU32[inpkts/4+i] = indata + i*pktsz;
		Module.HEAPU8.set(packets.content[i], indata + i*pktsz);
		Module.HEAPU32[index/4+i] = packets.num[i];
	    }
	    var outdata = Module._malloc(pktsz*numoutpkts);
	    var outpkts = Module._malloc(numoutpkts*4);
	    for (i = 0; i < numoutpkts; i++) {
		Module.HEAPU32[outpkts/4+i] = outdata + i*pktsz;
	    }

	    fec_decode(fec, inpkts, outpkts, index, pktsz);
	    var ret = [];
	    var copy, start, end;
	    for (i = 0; i < numoutpkts; i++) {
		start = Module.HEAPU32[outpkts/4 + i];
		end   = start + pktsz;
		copy = new Uint8Array(pktsz);
		copy.set(Module.HEAPU8.subarray(start, end));
		ret.push(copy);
	    }
	    Module._free(indata);
	    Module._free(inpkts);
	    Module._free(outdata);
	    Module._free(outpkts);
	    Module._free(index);
	    return ret;
	};
	self.free = function() {
	    fec_free(fec);
	    fec = undefined;
	    delete self.free;
	    delete self.encode;
	    delete self.decode;
	};
	return self;
    };
})();
    
