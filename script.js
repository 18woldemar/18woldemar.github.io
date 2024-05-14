$(document).ready(function () {
	$('.input').on('input', function () {
		start();
	});

	function escapeHtml(string) {
		const entityMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'/': '&#x2F;',
			'`': '&#x60;',
			'=': '&#x3D;'
		};
		return String(string).replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
	}

	function start() {
		var istr = $('.input').val();
		var ostr = "";
		var cond = 0;
		for (let i = 0; i < istr.length; i++) {
			var condp = cond;
			if (RegExp(/[A-Za-z]/, 'u').test(istr[i])) {
				cond = 1;
			} else if (RegExp(/[А-ЯЁа-яё]/, 'u').test(istr[i])) {
				cond = 2;
			} else {
				cond = 0;
			}
			if (condp == cond) {
				ostr = ostr + escapeHtml(istr[i]);
			} else {
				if (condp == 0 && cond == 1) {
					ostr = ostr + "<span_class='lat'>" + istr[i];
				} else if (condp == 0 && cond == 2) {
					ostr = ostr + "<span_class='cyr'>" + istr[i];
				} else if (cond == 0) {
					ostr = ostr + "</span>" + escapeHtml(istr[i]);
				} else if (condp == 1 && cond == 2) {
					ostr = ostr + "</span><span_class='cyr'>" + istr[i];
				} else if (condp == 2 && cond == 1) {
					ostr = ostr + "</span><span_class='lat'>" + istr[i];
				}
			}
		}
		ostr = ostr.replace(/\n/g, "<br>");
		ostr = ostr.replace(/\s/g, "&nbsp;");
		ostr = ostr.replace(/span_class/g, "span class");
		$('.output').html(ostr);
	}
	start();

	function syncScroll(el1, el2) {
		let $el1 = $(el1);
		let $el2 = $(el2);
		let forcedScroll = false;
		$el1.scroll(function () { performScroll($el1, $el2); });
		$el2.scroll(function () { performScroll($el2, $el1); });
		function performScroll($scrolled, $toScroll) {
			if (forcedScroll) return (forcedScroll = false);
			setScrollTopFromPercent($toScroll, $scrolled.scrollTop() / ($scrolled[0].scrollHeight - $scrolled.outerHeight()));
			setScrollLeftFromPercent($toScroll, $scrolled.scrollLeft() / ($scrolled[0].scrollWidth - $scrolled.outerWidth()));
		}
		function setScrollTopFromPercent($el, percent) {
			forcedScroll = true;
			$el.scrollTop(percent * ($el[0].scrollHeight - $el.outerHeight()));
		}
		function setScrollLeftFromPercent($el, percent) {
			forcedScroll = true;
			$el.scrollLeft(percent * ($el[0].scrollWidth - $el.outerWidth()));
		}
	}
	syncScroll($('.input'), $('.output'));
});