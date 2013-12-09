(function() {
	"use strict";
	var MiB = 1024*1024;
	var SLICESIZE = MiB;
	$("#file").on("change", function(e) {
		// Process file(s) when user has selected
		var work = $("#work");
		var start_time = new Date().getTime();
		$.each(e.target.files, function(i, file) {
			//console.log("%d %o", i, file);
			// Make a web worker, and ping-pong data to it.
			// Ping=hand over data slice. Pong=ack, please send more
			var worker = new Worker("sha256file-worker.js");
			var position = 0, sent_position = 0;
			var seq = 0;
			var reader = new FileReader();
			var fix = $("<span/>").css("font-family", "monospace").text("starting...");
			var div = $("<div/>").text(file.name+": ").append(fix);
			work.append(div);

			worker.addEventListener("message", function(e) {
				if (e.data.type === "ack") {
					console.log("'%s' progress: %.02f%", file.name, (100.0*e.data.position)/file.size);
					fix.text(Math.round(100.0*e.data.position/file.size)+"%");
					sendslice();
				}
				else if (e.data.type === "done") {
					console.log("'%s' done Hash: %o", file.name, e.data.hash);
					fix.text(e.data.hash);
					div.append(" Size: "+Math.round(file.size/MiB)+ " MiB");
					div.append(" " + Math.round(file.size/(new Date().getTime() - start_time)) + " kB/s")
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
