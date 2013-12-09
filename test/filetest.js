(function() {
	"use strict";
	var MiB = 1024*1024;
	var SLICESIZE = MiB;
	$("#file").on("change", function(e) {
		// Process file(s) when user has selected
		var work = $("#work");
		$.each(e.target.files, function(i, file) {
			console.log("%d %o", i, file);
			// Make a web worker, and ping-pong data to it.
			// Ping=hand over data slice. Pong=ack, please send more
			var worker = new Worker("filetest-worker.js");
			var position = 0, sent_position = 0;
			var seq = 0;
			var reader = new FileReader();
			var div = $("<div/>");
			work.append(div);

			worker.addEventListener("message", function(e) {
				if (e.data.type === "ack") {
					console.log("'%s' progress: %.02f%", file.name, (100.0*e.data.position)/file.size);
					div.text(file.name + ": "+(Math.round((10000.0*e.data.position)/file.size)/100.0)+"%");
					sendslice();
				}
				else if (e.data.type === "done") {
					console.log("'%s' done Hash: %o", file.name, e.data.hash);
					div.empty();
					(div.append(file.name+": ")
					    .append($("<span/>").css("font-family", "monospace").text(e.data.hash))
					    .append(" Size: "+Math.round(file.size/MiB)+ " MiB"));
					// Delete stuff? TODO: check if we leak memory
				}
				else {
					console.log("'%s' other %s: %o", file.name, e.data.type, e.data.data);
				}
			});

			function sendslice() {
				if (position >= file.size) return;
				if (reader.readyState === reader.LOADING) return;
				var end = position + SLICESIZE;
				if (end > file.size) end = file.size;
				//console.log("Reading slice %d-%d:%d", position, end, end-position);
				var blob = file.slice(position, end);
				reader.readAsArrayBuffer(blob);
				position = end;
			}
			reader.onload = function(e) {
				var size = e.target.result.byteLength;
				sent_position += size;
				worker.postMessage({type: "data", data: e.target.result, 'seq':seq++}, [e.target.result]);
				if (sent_position >= file.size) {
					console.log("'%s' Sending done to worker!", file.name);
					worker.postMessage({type: "done", 'seq': seq++});
				}
			};
			sendslice();
		});
	});
})();
