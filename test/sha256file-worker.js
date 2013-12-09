(function(self) {
	"use strict";
	importScripts("../src/sha256asm.js");
	var position = 0;
	var seq = 0;
	sha256.init();
	self.addEventListener("message", function(e) {
		var data = e.data;
		if (seq !== data.seq)
			throw("damnit, sequence was bad");
		seq += 1;
		if (data.type === "data") {
			position += data.data.byteLength;
			sha256.update(new self.Uint8Array(data.data));
			postMessage({type: "ack", position: position});
		}
		else if (data.type === "done") {
			postMessage({type: "done", hash:sha256.finish()});
			self.close();
		}
	});
})(self);
