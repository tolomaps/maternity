/************************************************************
This is my first attempt at learning D3, as part of the 
UW-Madison Interactive Cartography & Geovisualization course.

This website shows the state of being a working mother around
the world, highlighting health conditions, maternity leave 
policies, and women participation in the labor force.

Robin Tolochko
November 2014
*************************************************************/

//Set up all global variables

var keyArray = ["MaternalLeave", "MaternalDeath", "FemaleLaborForceTotal", "FemaleLaborForceParticipationRate", "FertilityRate"];
//array to hold colors for maternal & paternal leave
ordinalColorArray = [ "#fb6a4a",	//no paid leave 		
				  "#bcbddc",	//less than 14 weeks
				  "#9e9ac8",	//14-25 weeks
				  "#756bb1",	// 26-51 weeks
				  "#54278f",	//52 weeks or more
				  "#ccc"	]; 	//no data

//color array for maternal death
deathColorArray = [	"#54278f",
				"#756bb1",
				"#9e9ac8",
				"#bcbddc",
				"#dadaeb"	];

//array to hold colors for all other variables				
colorArray = [	"#dadaeb",
			"#bcbddc",
			"#9e9ac8",
			"#756bb1",
			"#54278f"	];

//array to hold values for maternal leave			
maternalLeaveArray = [  "No paid leave",
					"Less than 14 weeks",
					"14 - 25 weeks",
					"26 - 51 weeks",
					"52 weeks or more",
					"No data" ];
var currentVariable = keyArray[0]; 
var currentColors = []; //array to hold the colors currently displayed on map
var currentArray = []; //array to hold scale currently being rendered on map
var jsonCountries;
var colorize; //colorscale generator
var mapWidth = 1000, mapHeight = 500; //set map container dimensions
var chartTitle; //dynamic title for chart
var chartLabels = []; //dynamic labels for chart
var squareWidth = 10; //width of rects in chart (in pixels)
var squareHeight = 25; //height of rects in chart (in pixels)
var chart; //create chart
var chartWidth = 900; //width of chart (in pixels)
var chartHeight = (squareHeight*5)+5; //set chart container dimensions
var scale; 
var description; //description of selected variable

// Create global title for each variable
var title_MaternalLeave = "Maternity Leave Law";
var title_MaternalDeath = "Lifetime Risk of Maternal Death";
var title_FemaleLaborForceTotal = "Women as Percentage of Labor Force";
var title_FemaleLaborForceParticipationRate = "Women Labor Force Participation Rate";
var title_FertilityRate = "Fertility Rate"			

// Create global descriptions for each variable
var desc_MaternalLeave = "Workplace policies before and after childbirth - Length of Paid Maternal Leave";
var desc_MaternalDeath = "Life time risk of maternal death is the probability that a 15-year-old female will die eventually from a maternal cause assuming that current levels of fertility and mortality (including maternal mortality) do not change in the future, taking into account competing causes of death."
//Holds the current range of colors
var range;

//begin script when window loads 
window.onload = initialize();

function initialize() {
	setMap();
};

// set map parameters
function setMap(){

	var map = d3.select("body")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight)
		.attr("class", "map");

	//create page title
	var pageTitle = d3.select("body")
		.append("text")
		.attr("class", "pageTitle")
		.html("Modern Motherhood:<br>A World of Struggle");

	//Set the projection 
	var projection = d3.geo.naturalEarth()
    	.scale(170)
    	.translate([mapWidth / 2, mapHeight / 2])
    	.precision(.1);

    //Draw the SVG
    var path = d3.geo.path()
    	.projection(projection);

	//create graticule generator
	var graticule = d3.geo.graticule(); 

	//create graticule background (aka water)
	var gratBackground = map.append("path")
		.datum(graticule.outline)
		.attr("class", "gratBackground")
		.attr("d", path)

	var gratLines = map.selectAll(".gratLines")
		.data(graticule.lines) //
		.enter()
		.append("path") //append one path for each element of the data (in this case, each graticule line)
		.attr("class", "gratLines")
		.attr("d", path) //this path is the variable path defined above. path generator

	//use queue.js to load all data at the same time
	queue()
		.defer(d3.csv, "data/maternityData.csv")
		.defer(d3.json, "data/countries.topojson")
		.await(callback);

	// function callback(error, maternityData, countries) {
	// 	var countries = map.selectAll(".countries")
	// 		.data(topojson.feature(countries, countries.objects.countries).features)
	function callback(error, maternityData, countries) { //the callback function accepts an error, and then after the error, one parameter for each defer line within queue(). it accepts them in the same order that the defer lines are placed... so in this case, maternityData is written first, and then countries, so that's the order they're accepted as parameters

		var colorize = colorScale(maternityData);

		//create variable for csv to json data transfer
		var jsonCountries = countries.objects.countries.geometries;
		//Create outer loop through csv data. Assign each country code to a variable.
		for (var i=0; i<maternityData.length; i++) {
			var csvCountry = maternityData[i]; 
			var csvCountryCode = csvCountry.code3;

			//create inner loop through json data to assign csv data to correct country
			for (var j = 0; j < jsonCountries.length; j++) {
				
				//if the country codes match, attach the CSV data to the json object
				if (jsonCountries[j].properties.code3 == csvCountryCode) {
					//inner loop to add the csv values to the json object
					for (var key in keyArray) {
						//for the Maternal Leave and Paternal Leave attributes, the data is qualitative, so shouldn't convert to a float
						if (keyArray[key] == "MaternalLeave" || keyArray[key] == "PaternalLeave") {
							var attribute = keyArray[key];
							var value = csvCountry[attribute];
							jsonCountries[j].properties[attribute] = value;
						//for the Fertility Rate, round to one decimal point
						} else if (keyArray[key] == "FertilityRate") {
							var attribute = keyArray[key];
							var value = csvCountry[attribute];
							jsonCountries[j].properties[attribute] = value;
						} else {
						//else, round to nearest integer, and attach CSV data to json object
							var attribute = keyArray[key];
							var value = parseFloat(csvCountry[attribute]);
							jsonCountries[j].properties[attribute] = value;
							// console.log(jsonCountries[j]);
						};
					};
					break; //stop looking through json countries
				};
			};
		};

		var countries = map.selectAll(".countries")
			.data(topojson.feature(countries, countries.objects.countries).features) //translates data into an array of geojson features. essentially creates a for-in loop. for element in data, do this. and this is defined by everything below.
			.enter()
			.append("path")
			.attr("class", function(d) {
				return "countries " + d.properties.code3;
			})
			.attr("d", function(d) {
				return path(d);
			})
			.style("fill", function(d){
				// console.log(choropleth(d, colorize));	
				return choropleth(d, colorize); // updates dynamically depending on the currentVariable
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
		
		var countriesColor = countries.append("desc")
				.text(function(d) {
					return choropleth(d, colorize);
				});

		//Attempt to create topojson mesh to minimize complexity at borders		
		// var borders = svg.append("path")
		// 	.datum(topojson.mesh(countries, countries.properties.code3, function(a, b) {
		// 		return a !==b;
		// 	}));


		createDropdown(maternityData);
		setChart(maternityData, colorize); //create coordinated visualization
		// createDescriptions(maternityData);
		// about();
		// zoom();
	};
};

function createDropdown(maternityData) {
	var d_label;
	var dropdown = d3.select("body")
		.append("div")
		.attr("class", "dropdown")
		.html("<h3>Select an Indicator:</h3>")
		.append("select")
		.on("change", function() { changeAttribute(this.value, maternityData) } );

	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d) { return d })
		.text(function(d) {
			if (d == "MaternalLeave") {
				d = title_MaternalLeave;
			} else if (d == "PaternalLeave") {
				d = "Paternity Leave Law";
			} else if (d == "MaternalDeath") {
				d = title_MaternalDeath;
			} else if (d == "FemaleLaborForceTotal") {
				d = title_FemaleLaborForceTotal;
			} else if (d == "FemaleLaborForceParticipationRate") {
				d = title_FemaleLaborForceParticipationRate;
			} else if (d == "FertilityRate") {
				d = title_FertilityRate;
			};
			return d;
		});
};

function changeAttribute(attribute, maternityData) {

	//update the current variable
	currentVariable = attribute;
	colorize = colorScale(maternityData);

	//update the map colors
	d3.selectAll(".countries") 
		.style("fill", function(d) {
			return choropleth(d, colorize);
		})
		.select("desc")
			.text(function(d) {
				return choropleth(d, colorize);
			});

	var squares = d3.selectAll(".square");
	updateChart(squares, maternityData.length, maternityData);
	// createDescriptions(maternityData);
};

function colorScale(maternityData) {
	//creating a variable to hold color generator
	// var color;
	//if the data is ordinal, set color to an ordinal scale
	if (currentVariable == "MaternalLeave" || currentVariable == "PaternalLeave") {
		scale = d3.scale.ordinal();
		currentColors = ordinalColorArray;
	//the Maternal Death variable should have reversed colors to represent higher rates of death as darker colors
	} else if (currentVariable == "MaternalDeath") {
		scale = d3.scale.threshold();
		currentColors = deathColorArray;
	} else { //otherwise, set color to a threshold scale with regular colors
		scale = d3.scale.threshold();
		currentColors = colorArray;
	};

	//set the range to the appropriate range based on which variable is selected
	scale = scale.range(currentColors);
	
	for (var i in maternityData) {
		//if the data is ordinal, just add the string to the current array
		if (currentVariable == "MaternalLeave" || currentVariable == "PaternalLeave") {
			currentArray = maternalLeaveArray; 
		} else if (currentVariable == "MaternalDeath") { //else, convert data to number and add to current array
			currentArray = [100, 500, 1000, 5000, 50000];
		} else if (currentVariable == "FemaleLaborForceTotal") {
			currentArray = [30, 40, 45, 50, 60];
		} else if (currentVariable == "FemaleLaborForceParticipationRate") {
			currentArray = [30, 50, 57, 65, 100];
		} else if (currentVariable == "FertilityRate") {
			currentArray = [1.5, 2, 3, 5, 8];
		};
	};
	scale.domain(currentArray); //pass array of values as the domain
	return scale; //return color scale generator
};

function choropleth(d, colorize){
	//get data value
	
	var value = d.properties ? d.properties[currentVariable] : d[currentVariable];
	//if the value exists, assign it a color; otherwise assign gray
	if (value) {
		return colorize(value);
	} else if (value == "No data") {
		return "#ccc";
	} else {
		return "#ccc";
	}
};

function setChart(maternityData, colorize) {

	//create container for chart
	chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	//create chart title
	chartTitle = d3.select("body")
		.append("text")
		.attr("class", "chartTitle");

	chartLabels = d3.select("body")
		.append("div")
		.attr("class", "chartLabels");

	//append squares to the chart, one square to represent each country
	var squares = chart.selectAll(".square")
		.data(maternityData)
		.enter()
		.append("rect")
		.attr("class", function(d){
			return "square " + d.code3;
		})
		.attr("width", squareWidth+"px")
		.attr("height", squareHeight+"px");

	updateChart(squares, maternityData.length, maternityData);
};

function updateChart(squares, numSquares, maternityData){
	colorize = colorScale(maternityData);
	var xValue = 0; 
	var yValue = 0;
	var colorObjectArray = [];

	console.log(currentArray);

	//create chart labels dynamically, based on currentVariable/currentArray
	var chartLabel = chartLabels.html(function(d) {
		if (currentVariable == "MaternalLeave") {
			return currentArray[0]+"<br>"
			+currentArray[1]+"<br>"
			+currentArray[2]+"<br>"
			+currentArray[3]+"<br>"
			+currentArray[4]+"<br>";
		} else if (currentVariable == "MaternalDeath") {
			return "1:"+currentArray[0]+"<br>"
			+"1:"+currentArray[1]+"<br>"
			+"1:"+currentArray[2]+"<br>"
			+"1:"+currentArray[3]+"<br>"
			+"1:"+currentArray[4]+"<br>";
		} else if (currentVariable == "FemaleLaborForceTotal") {
			return currentArray[0]+"%"+"<br>"
			+currentArray[1]+"%"+"<br>"
			+currentArray[2]+"%"+"<br>"
			+currentArray[3]+"%"+"<br>"
			+currentArray[4]+"%"+"<br>";			
		} else if (currentVariable == "FemaleLaborForceParticipationRate") {
			return currentArray[0]+"%"+"<br>"
			+currentArray[1]+"%"+"<br>"
			+currentArray[2]+"%"+"<br>"
			+currentArray[3]+"%"+"<br>"
			+currentArray[4]+"%"+"<br>";	
		} else if (currentVariable == "FertilityRate") {
			return currentArray[0]+"<br>"
			+currentArray[1]+"<br>"
			+currentArray[2]+"<br>"
			+currentArray[3]+"<br>"
			+currentArray[4]+"<br>";
		}
	});

	//update chart title based on selected attribute
	chartTitle.text(function(d) {
		if (currentVariable == "MaternalLeave") { return title_MaternalLeave+" (Length of Paid Maternal Leave)"; }
		else if (currentVariable == "MaternalDeath") { return title_MaternalDeath+" (Probability a woman will eventually die from a maternal cause)"; }
		else if (currentVariable == "FemaleLaborForceTotal") { return title_FemaleLaborForceTotal; }
		else if (currentVariable == "FemaleLaborForceParticipationRate") { return title_FemaleLaborForceParticipationRate+" (Percentage of Women Ages 15+ Who Work)"; }
		else if (currentVariable == "FertilityRate") { return title_FertilityRate+" (Average Number of Children per Woman)"; } 
	});

	//create object array to hold a count of how many countries are in each class
	for (i = 0; i < currentColors.length; i++) {
		var colorObject = {"color": currentColors[i],"count":0} ;
		colorObjectArray.push(colorObject);			
	}

	var squareColor = squares.style("fill", function(d) {
			return choropleth(d, colorize);
		})
		.attr("x", function(d,i) {
			color = choropleth(d, colorize);
			//for loop arranges each class so that the squares are contiguous horizontally
			for (i = 0; i < colorObjectArray.length; i++) {
				if (colorObjectArray[i].color == color) {
					xValue = colorObjectArray[i].count*(squareWidth+1);
					colorObjectArray[i].count+=1;
				}
				if (color == "#ccc" || color == undefined) {
					xValue = -100000;
				}
			}
			return xValue;
		})
		.attr("y", function(d,i) {
			color = choropleth(d, colorize);
			// var xLocation = Parse(this);
			if (color == currentColors[0]) {
				return 0
			} else if (color == currentColors[1]) {
				return (squareHeight+1);
			} else if (color == currentColors[2]) {
				return (squareHeight+1)*2;
			} else if (color == currentColors[3]) {
				return (squareHeight+1)*3;
			} else if (color == currentColors[4]) {
				return (squareHeight+1)*4;
			} else if (color == currentColors[5]) {
				return (squareHeight+1)*5;
			}
		})
		.on("mouseover", highlightChart)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	};

function highlightChart(maternityData) {
	var properties = maternityData.properties ? maternityData.properties : maternityData;
	
	d3.selectAll("."+properties.code3)
		.style("fill", "#f7eb3e");

	var labelAttribute = properties[currentVariable]+"<br>"+currentVariable;

	var labelName;
	if (properties.name_long == undefined) {
		labelName = properties.Country;
	} else {
		labelName = properties.name_long;
	}
	
	if (Boolean(properties[currentVariable]) == true) {
		if (currentVariable == "MaternalLeave") {
			labelAttribute = properties[currentVariable];
		} else if (currentVariable == "MaternalDeath") {
			labelAttribute = "1 in "+properties[currentVariable]+"<br>women die from maternal causes"
		} else if (currentVariable == "FemaleLaborForceTotal") {
			labelAttribute = Math.round(properties[currentVariable])+"% of the labor force is composed of women"
		} else if (currentVariable == "FemaleLaborForceParticipationRate") {
			labelAttribute = Math.round(properties[currentVariable])+"% of women work"
		} else if (currentVariable == "FertilityRate") {
			labelAttribute = Math.round(properties[currentVariable]*10)/10+"<br>Average Number of Children Per Woman"
		};
	} else { //if no data associated with selection, display "No data"
		labelAttribute = "No data";
	};

	var infoLabel = d3.select("body")
		.append("div")
		.attr("class", "infoLabel")
		.attr("id",properties.code3+"label")
		.html(labelName)
		.append("div")
		.html(labelAttribute)
		.attr("class", "labelName");	
}


function highlight(maternityData) {
	var properties = maternityData.properties ? maternityData.properties : maternityData;
	
	d3.selectAll("."+properties.code3)
		.style("fill", "#f7eb3e");

	var labelAttribute = properties[currentVariable]+"<br>"+currentVariable;
	
	var labelName;
	if (properties.name_long == undefined) {
		labelName = properties.Country;
	} else {
		labelName = properties.name_long;
	}
	
	if (Boolean(properties[currentVariable]) == true) {
		if (currentVariable == "MaternalLeave") {
			labelAttribute = properties[currentVariable];
		} else if (currentVariable == "MaternalDeath") {
			labelAttribute = "1 in "+properties[currentVariable]+"<br>women die from maternal causes"
		} else if (currentVariable == "FemaleLaborForceTotal") {
			labelAttribute = Math.round(properties[currentVariable])+"% of the labor force is composed of women"
		} else if (currentVariable == "FemaleLaborForceParticipationRate") {
			labelAttribute = Math.round(properties[currentVariable])+"% of women work"
		} else if (currentVariable == "FertilityRate") {
			labelAttribute = Math.round(properties[currentVariable]*10)/10+"<br>Average Number of Children Per Woman"
		};
	} else { //if no data associated with selection, display "No data"
		labelAttribute = "No data";
	};


	var infoLabel = d3.select("body")
		.append("div")
		.attr("class", "infoLabel")
		.attr("id",properties.code3+"label")
		.html(labelName)
		.append("div")
		.html(labelAttribute)
		.attr("class", "labelName");
};

function dehighlight(maternityData) {
	var properties = maternityData.properties ? maternityData.properties : maternityData;

	var selection = d3.selectAll("."+properties.code3);

	var fillColor = selection.select("desc").text();
	selection.style("fill", fillColor);
	
	var deselect = d3.select("#"+properties.code3+"label").remove(); //remove info label
};

function moveLabel(maternityData) {

	//horizontal label coordinate based mouse position stored in d3.event
	var x = d3.event.clientX < window.innerWidth - 245 ? d3.event.clientX+10 : d3.event.clientX-210; 
	//vertical label coordinate
	var y = d3.event.clientY < window.innerHeight - 100 ? d3.event.clientY-75 : d3.event.clientY-175; 
	
	d3.select(".infoLabel") //select the label div for moving
		.style("margin-left", x+"px") //reposition label horizontal
		.style("margin-top", y+"px"); //reposition label vertical
};

function createDescriptions(maternityData) {
	var descriptionDiv = d3.select("body")
		.append("div")
		.attr("class", "descriptionDiv");

	descriptionTitle = descriptionDiv
		.append("text")
		.html(function(d) {
			if (currentVariable == "MaternalLeave") { return title_MaternalLeave+"<br>" }
			if (currentVariable == "MaternalDeath") { return title_MaternalDeath+"<br>"; }
			if (currentVariable == "FemaleLaborForceTotal") { return title_FemaleLaborForceTotal+"<br>"; }
			if (currentVariable == "FemaleLaborForceParticipationRate") { return title_FemaleLaborForceParticipationRate+"<br>"; }
			if (currentVariable == "FertilityRate") { return title_FertilityRate+"<br>"; } 
		})
		.attr("class", "descriptionTitle");

	description = descriptionDiv
		.append("text")
		.text(function(d) {
			if (currentVariable == "MaternalLeave") { return desc_MaternalLeave; }
		})
		.attr("class", "description");
}

function updateDescriptions(maternityData) {

}

function about() {
	var about = d3.select("body")
	.append("text")
	.attr("x", 500)
	.attr("y", 40)
	.text("About this project:")
	.attr("class", "about");
}

// function zoom() {
// 	var zoom = d3.behavior.zoom()
// 	    	.translate([0, 0])
// 	    	.scale(1)
// 	    	.scaleExtent([1, 8])
// 	    	.on("zoom", zoomed);

// 	var background = d3.select(".map")
// 		.append("rect")
// 	    	.attr("class", "background")
// 	    	.attr("width", mapWidth)
// 	    	.attr("height", mapHeight)
// 	    	.on("click", reset);

// 	function reset() {
// 		active.classed("active", false);
// 		active = d3.select(null);

// 		svg.transition()
// 		    .duration(750)
// 		    .call(zoom.translate([0, 0]).scale(1).event);
// 		}

// 	function zoomed() {
// 		g.style("stroke-width", 1.5 / d3.event.scale + "px");
// 		g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
// 	};
// };