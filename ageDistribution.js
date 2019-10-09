var padding = 10;
var barHeight = 20;
var fontSize = 20;
var formatPercent = d3.format(".0%");

var svg = d3.select("svg");

var ages = d3.csv("ageDistribution.csv")

d3.csv("ageDistribution.csv", displayData);

// create function to display data from csv
function displayData(error, data) {
	// create an array of unique years
	var yearSet = [...new Set(data.map(function(d){ return d.year}))]

	// create an array of unique ages
	var agesSet = [...new Set(data.map(function(d){ return d.age}))]

	// add another key for each object to represent the order of the ages
	agesSet.forEach(function(a, i){
		data.forEach(function(d){
			if(d.age == a){
				d['ageOrder'] = i;
			}
		})
	})
	
	var graph = buildGraph(200, svg, data, padding, barHeight, 2010, 1);
	// get the rects and the text so they can be updated farther below in the code
	var rects = graph.r;
	var texts = graph.t;

	// create a scale for the x axis at the top of the graph to %14
	var xScale = d3.scaleLinear()
		.domain([0, .14])
		.range([0,560]);

	// create the x axis with the above scale
	var xAxis = d3.axisTop(xScale)
		.ticks(8)
		.tickFormat(formatPercent);

	// append the x axis
	d3.select('svg')
		.append('g')
		.attr("transform", "translate(100, 20)")
		.call(xAxis);
	
	// add mouse events for hovering
	rects
		.on('mouseover', function(d, i) {
			d3.select(this)
				.style('fill', 'steelblue');
		})
		.on('mouseleave', function() {
			d3.select(this)
				.style('fill', 'orange');
		})

	// create the select for years and set a selected value of 2010
	createSelect("#years", yearSet, '2010');

	// select year, filter data, update the graph(update bars, add bars, remove bars)
	d3.select('#years')
	  .on('change', function() {
	  	var selectedId = d3.select("#ord-select").property('value');

	  	var year = d3.select(this).property('value');
	  	
	  	// check what order is selected then select and update
	  	// if the order has been changed, reset to age descending then rebuild(update) the graph
	  	if(['% descending', '% ascending', 'age descending'].includes(selectedId) == true){
		  	selectAndUpdate(rects, texts, "#years", "ageOrder", data, "asc", padding, barHeight, 1);
		  	buildGraph(2000, svg, data, padding, barHeight, year);
	  	} else {
	  		buildGraph(200, svg, data, padding, barHeight, year);
	  	}
	});

	// create the select for ordering by value or age, start with age ascending
	var orderData = ['age ascending', 'age descending', '% ascending', '% descending'];
	createSelect("#ord-select", orderData, orderData[0]);

	// on order select, filter data and update the rects and texts
	d3.select("#ord-select")
		.on('change', function(d, i){
			var selectedId = d3.select("#ord-select").property('value');
			
			if(selectedId == "% descending")
				selectAndUpdate(rects, texts, "#years", "value", data, "asc", padding, barHeight);
			else if(selectedId == "% ascending")
				selectAndUpdate(rects, texts, "#years", "value", data, "desc", padding, barHeight);			
			else if(selectedId == "age ascending")
				selectAndUpdate(rects, texts, "#years", "ageOrder", data, "asc", padding, barHeight);
			else if(selectedId == "age descending")
				selectAndUpdate(rects, texts, "#years", "ageOrder", data, "desc", padding, barHeight);
		});
}
	
// DECLARE FUNCTIONS

// create a select with options
function createSelect(id, data, selectedVal){
	d3.select(id)
		.selectAll("option")
		.data(data)
		.enter()
		.append("option")
		.text(function(d){
			return d;
		})
		.attr("value", function(d){
			return d;
		})
		.attr("class", "year");

	// start with a selected value
	d3.select("option[value='" + selectedVal + "']")
		.attr("selected", true)
}

// filter data for selecting by a year
function fltrdData(data, yr) {
	var fltrdData = data.filter(function(d,i){
		return d.year == yr
	});

	return fltrdData;
}

// build or update the graph, pass in flag for new or update
function buildGraph(delay, svg, data, padding, barHeight, yr, isNew=0){
	
	if (isNew) { // BUILD RECTS NEW
		var rects = svg.selectAll('rect')
			.data(fltrdData(data, yr)) // FILTER THE DATA
	    	.enter()
	        .append("rect")
			.attr("transform", "translate(0, 20)")
			.attr("x", 100)
			.attr("y", function(d, i) {
				return padding + i * (barHeight + padding);
			})
			.attr("height", barHeight)
			.style("fill", "orange");	
	} else { // UPDATE THE RECTS DATA AND UPDATE RECTS OR REMOVE RECTS
		var rects = svg.selectAll('rect')
			.data(fltrdData(data, yr));
	        
	    rects
	    	.enter()
	        .append("rect")
			.attr("transform", "translate(0, 20)")
			.attr("x", 100)
			.attr("y", function(d, i) {
				return padding + i * (barHeight + padding);
			})
			.attr("height", barHeight)
			.style("fill", "orange")	
			.exit()
	    	.remove();
	}
	
	var s = d3.transition()
		.delay(delay)
		.duration(1000);

	rects
		.transition(s)
		.attr("width", function(d, i) { 
			return d.value * 4e3;
		});	

	var texts = svg.selectAll('text')
		.data(fltrdData(data, 2010))
		.enter().append("text")
		.attr("transform", "translate(0, 20)")
		.attr('x', 0)
		.attr('y', function(d, i) {
			return (i + 1) * (barHeight + padding);
		})
		.attr('font-size', fontSize)
		.text(function(d) {
			return d.age;
		});

	// return rects and texts to be updated later
	return {r: rects, t: texts}
}

// select and update the rects and texts for the order select(asc desc)
function selectAndUpdate(rects, texts, id, selectBy, data, order, padding, barHeight, resetOrder=0) {
	var yr = d3.select(id).property('value');

	rects
		.data(fltrdData(data, yr))
		.sort(function(a, b) {
			if(order == "asc")
				return a[selectBy] - b[selectBy];
			else if(order == "desc")
				return b[selectBy] - a[selectBy];
		})
		.transition()
		.delay(function(d, i) {
			return i * 50;  // gives it a smoother effect
		})
		.duration(1000)
		.attr("x", 100)
		.attr("y", function(d, i) {
			return padding + i * (barHeight + padding);
		});

	texts
		.data(fltrdData(data, yr))
		.sort(function(a, b) {
			if(order == "asc")
				return a[selectBy] - b[selectBy];
			else if(order == "desc")
				return b[selectBy] - a[selectBy];
		})
		.transition()
		.delay(function(d, i) {
			return i * 50;  // gives it a smoother effect
		})
		.duration(1000)
		.attr("x", 0)
		.attr("y", function(d, i) {
			return (i + 1) * (barHeight + padding);
		});
	
	// reset the ord-select to display age ascending as selected if the user changes the year select
	if(resetOrder){
		$('#ord-select')
	    .val('age ascending')
	    .trigger('change');
	}
}
