	var squareColor = squares.style("fill", function(d) {
			return choropleth(d, colorize);
		})
		.attr(["x", "y"], function(d,i) {
			color = choropleth(d, colorize);
			//for loop arranges each class so that the squares are contiguous horizontally
			for (i = 0; i < colorObjectArray.length; i++) {
				if (colorObjectArray[i].color == color) {
					xValue = colorObjectArray[i].count*16.5;
					colorObjectArray[i].count+=1;
				}
				if (color == currentColors[0]) {
					if (xValue > chartWidth) {
						yValue = 0 + 16.5;
					} else {
						yValue = 0;
					}
				} else if (color == currentColors[1]) {
					if (xValue > chartWidth) {
						yValue = 100 + 16.5;
					} else {
						yValue = 100;
					}
				} else if (color == currentColors[2]) {
					if (xValue > chartWidth) {
						yValue = 200 + 16.5;
					} else {
						yValue = 200;
					}
				} else if (color == currentColors[3]) {
					if (xValue > chartWidth) {
						yValue = 300 + 16.5;
					} else {
						yValue = 300;
					}
				} else if (color == currentColors[4]) {
					if (xValue > chartWidth) {
						yValue = 400 + 16.5;
					} else {
						yValue = 400;
					}
				} else if (color == currentColors[5]) {
					if (xValue > chartWidth) {
						yValue = 500 + 16.5;
					} else {
						yValue = 500;
					}
				}
			}
			return [xValue, yValue];
		})
	console.log [xValue, yValue];
	};