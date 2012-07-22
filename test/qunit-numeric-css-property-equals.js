QUnit.extend(QUnit, {
	rxNumericCSSProperty: /[0-9.]+/g,
	numericCSSPropertyEquals: function(actual, expected, message) {
		//Simple case, both strings already match.
		if(actual === expected) {
			QUnit.push(true, actual, expected, message);

			return;
		}

		//Now extract all numbers from the property string.
		//e.g. "0.5px 100px" will result in ["0.5", "100"]
		var actualArray = actual.match(QUnit.rxNumericCSSProperty);
		var expectedArray = expected.match(QUnit.rxNumericCSSProperty);

		var passes = actualArray !== null && expectedArray !== null && actualArray.length === expectedArray.length;

		for(var i = 0; passes && i < actualArray.length; i++) {
			var curActual = actualArray[i];
			var curExpected = expectedArray[i];
			var delta = 0.01;

			//Use 0.01 for floats and 1 for ints.
			if(curActual.indexOf('.') === -1 && curExpected.indexOf('.') === -1) {
				delta = 1;
			}

			curActual = parseFloat(curActual);
			curExpected = parseFloat(curExpected);

			passes = (curActual === curExpected) || Math.abs(curActual - curExpected) <= delta;
		}

		QUnit.push(passes, actual, expected, message);
	}
});
