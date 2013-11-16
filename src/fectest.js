(function() {
    "use strict";

    var okclick = function() {
	var k = parseInt($("#k")[0].value);
	var m = parseInt($("#m")[0].value);
	function split(event, input, textareas) {
	    var text = input.val() + "\x00";
	    var pktsz = Math.ceil(text.length / k);
	    var padding = k*pktsz - text.length;
	    var i;
	    for (i = 0; i < padding; i++) {
		text += "\x00";
	    }
	    for (i = 0; i < k; i++) {
		textareas[i].val(text.substr(i*pktsz, pktsz));
	    }
	}
	if (isNaN(k)|| isNaN(m) || k >= m || k < 1) {
	    console.log("k must be less than m");
	    return;
	}
	var work = $("#work");
	work.empty();
	var i, textareas = [], text;
	var input = $("<textarea/>");
	work.append(input);
	for (i = 0; i < k; i++) {
	    text = $("<textarea/>").attr("disabled", true);
	    textareas.push(text);
	    work.append(text);
	}
	input.on("keyup", function(x) {split(x, input, textareas); });
	var encode = ($("<input/>")
		      .attr("type",  "button")
		      .attr("value", "Encode"));
	work.append(encode);
	work.append($("<br/>"));
	var outarea = []
	var box;
	var outbox = [];
	for (i = 0; i < m; i++) {
	    box = $("<input/>").attr("type", "checkbox").attr("checked", true);
	    work.append(box);
	    outbox.push(box);
	    text = $("<textarea/>");
	    work.append(text);
	    outarea.push(text);
	}
	var decode = ($("<input/>")
		      .attr("type",  "button")
		      .attr("value", "Decode"));
	work.append(decode);
	work.append($("<br/>"));
	var decarea = []
	for (i = 0; i < k; i++) {
	    text = $("<textarea/>").attr("disabled", true);
	    work.append(text);
	    decarea.push(text);
	}
	encode.on("click", function() {
	    var i,ary;
	    var encoder = fec(k, m);
	    var r = encoder.encode(intArrayFromString(input.val()));
	    function toarray(some) {
		var i, ret = [];
		for (i = 0; i < some.length; i++) {
		    ret.push(some[i]);
		}
		return ret;
	    }
	    for (i = 0 ; i < k; i++) {
		ary = intArrayFromString(textareas[i].val());
		ary.pop();
		outarea[i].val(ary.join(', '));
	    }
	    for (; i < m; i++) {
		outarea[i].val(toarray(r[i-k]).join(', '));
	    }
	    encoder.free();
	});
	decode.on("click", function () {
	    var i;
	    var packets = [];
	    for (i = 0; i < m && packets.length < k; i++) {
		if(outbox[i].is(":checked")) {
		    packets.push([
			i,
			$(outarea[i].val().split(",")).map(function(i, str) {
			    return parseInt($.trim(str));
			})]);
		}
	    }
	    var decoder = fec(k, m);
	    var r = decoder.decode(packets);
	    decoder.free();
	    var j = 0, l = 0;
	    for (i = 0; i < k; i++) {
		if (outbox[i].is(":checked")) {
		    decarea[i].val(intArrayToString(packets[j][1]));
		    j++;
		}
		else {
		    decarea[i].val(intArrayToString(r[l]));
		    l++;
		}
	    }
	});
    };
    $("#ok").bind("click", okclick);
    okclick();
})();
