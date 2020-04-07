var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 60,
  right: 60,
  bottom: 120,
  left: 150
};

var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;

var svg = d3.select("#scatter")
  .append("svg")
  .classed("chart", true)
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


var acsData = null;  
var yAxisLabels = ["obesity", "smokes", "healthcare"];
var chosenXAxis = "poverty";
var yAxisLabels = ["obesity", "smokes", "healthcare"];
var xAxisLabels = ["poverty", "age", "income"]; 
var labelsTitle = { "poverty": "In Poverty (%)", 
                    "age": "Age (Median)", 
                    "income": "Household Income (Median)",
                    "obesity": "Obese (%)", 
                    "smokes": "Smokes (%)", 
                    "healthcare": "Lacks Healthcare (%)" };
var axisPadding = 20;

function scale(acsData, chosenAxis, xy) {
    var axisRange = (xy === "x") ? [0, chartWidth]:[chartHeight, 0]
    
    // create scales for chosen axis
    var linearScale = d3.scaleLinear()
      .domain([d3.min(acsData, d => d[chosenAxis]) * 0.8,
        d3.max(acsData, d => d[chosenAxis]) * 1.2
      ])
      .range(axisRange);
  
    return linearScale;
}

function renderAxis(newScale, Axis, xy) {
    var posAxis = (xy === "x") ? d3.axisBottom(newScale):d3.axisLeft(newScale)
  
    Axis.transition()
      .duration(1000)
      .call(posAxis);
  
    return Axis;
}

function renderCircles(elemEnter, newScale, chosenAxis, xy) {

    elemEnter.selectAll("circle")
        .transition()
        .duration(1000)
        .attr(`c${xy}`, d => newScale(d[chosenAxis]));

    elemEnter.selectAll("text")
        .transition()
        .duration(1000)
        .attr(`d${xy}`, d => newScale(d[chosenAxis]));
  
    return elemEnter;
}

function updateToolTip(chosenXAxis, chosenYAxis, elemEnter) {
    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(d => `${d.state} <br>${chosenXAxis}: ${d[chosenXAxis]} <br>${chosenYAxis}: ${d[chosenYAxis]}`);
    
    svg.call(tool_tip);

    elemEnter.classed("active inactive", true)
    .on('mouseover', tool_tip.show)
    .on('mouseout', tool_tip.hide);
   
    return elemEnter;
}

function updateChart() {
    var value = d3.select(this).attr("value");
    var xy = xAxisLabels.includes(value) ? "x":"y";
    var elemEnter = d3.selectAll("#elemEnter");
    var axis = (xy==="x") ? d3.select("#xAxis"):d3.select("#yAxis");
    chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;

    if (value !== chosenAxis) {
        if(xy === "x") {
            chosenXAxis = value;
        }
        else {
            chosenYAxis = value;
        };

        chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;
        linearScale = scale(acsData, chosenAxis, xy);
        axis = renderAxis(linearScale, axis, xy);
        elemEnter = renderCircles(elemEnter, linearScale, chosenAxis, xy);
        elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
        axisLabels = (xy === "x") ? xAxisLabels:yAxisLabels
        axisLabels.forEach(label => {
            if(label === value) {
                d3.select(`[value=${label}]`).classed("active", true);
                d3.select(`[value=${label}]`).classed("inactive", false);
                d3.select(`[value=${xy+label}]`).classed("invisible", true);
            }
            else {
                d3.select(`[value=${label}]`).classed("active", false);
                d3.select(`[value=${label}]`).classed("inactive", true);
                d3.select(`[value=${xy+label}]`).classed("invisible", false);
            }
        });
    };
}

function updateLabelsTooltip(xy, labelEnter) {
    xy = (xy === "x") ? "y":"x";
    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(d => `Move ${d} to ${xy}-axis`);
    
    svg.call(tool_tip);
    labelEnter.classed("active inactive", true)
    .on('mouseenter', tool_tip.show)
    .on('mouseleave', tool_tip.hide)
    .on('mousedown', tool_tip.hide);

    return labelEnter;
}

function updateLabelsRect(xy, xPos, labelsRect) {
    var squareSize = 12;
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    var enterlabelsRect = null;
    enterlabelsRect = labelsRect.enter()
        .append("rect")
        .merge(labelsRect)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding-squareSize)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenAxis) ? true:false)
        .attr("value", d => xy+d)
        .on("click", updateLabel);;

    return enterlabelsRect;
}

function updateLabelsText(xy, xPos, labelsText) {
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    var enterlabelsText = null; labelsText.enter()
        .append("text");
    enterlabelsText = labelsText.enter()
        .append("text")
        .merge(labelsText)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d)
        .classed("active", d => (d === chosenAxis) ? true:false)
        .classed("inactive", d => (d === chosenAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);
}

function updateLabel() {
    var moveLabel = d3.select(this).attr("value");
    var oldAxis = moveLabel.slice(0,1);
    var selectedLabel = moveLabel.slice(1);

    if (oldAxis === "x") {
        xAxisLabels = xAxisLabels.filter(e => e !== selectedLabel);
        yAxisLabels.push(selectedLabel);
    } 
    else {
        yAxisLabels = yAxisLabels.filter(e => e !== selectedLabel);
        xAxisLabels.push(selectedLabel);
    }

    var xLabels = d3.select("#xLabels");
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels);
    xEnterLabelsRect = updateLabelsRect("x", -120, xLabelsRect);
    updateLabelsTooltip("x", xEnterLabelsRect);
    xLabelsRect.exit().remove();
    
    var xLabelsText = xLabels.selectAll("text")
        .data(xAxisLabels);
    
    updateLabelsText("x", 0, xLabelsText);
    
    xLabelsText.exit().remove();
    
    var yLabels = d3.select("#yLabels");
    
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    
    yEnterLabelsRect = updateLabelsRect("y", -45, yLabelsRect);
    
    updateLabelsTooltip("y", yEnterLabelsRect);
    
    yLabelsRect.exit().remove();
    
    var yLabelsText = yLabels.selectAll("text")
        .data(yAxisLabels);
    
    updateLabelsText("y", margin.top, yLabelsText);
    
    yLabelsText.exit().remove();
}


function init() {

    var r = 10;
    var xLinearScale = scale(acsData, chosenXAxis, "x");
    var yLinearScale = scale(acsData, chosenYAxis, "y");

    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    var xAxis = chartGroup.append("g")
        .classed("axis", true)
        .attr("transform", `translate(0, ${chartHeight})`)
        .attr("id", "xAxis")
        .call(bottomAxis);

    var yAxis = chartGroup.append("g")
      .classed("axis", true)
      .attr("id", "yAxis")
      .call(leftAxis);

    var elem = chartGroup.selectAll("g circle")
        .data(acsData);

    var elemEnter = elem.enter()
        .append("g")
        .attr("id", "elemEnter");

    elemEnter.append("circle")
        .attr('cx', d => xLinearScale(d[chosenXAxis]))
        .attr('cy', d => yLinearScale(d[chosenYAxis]))
        .attr('r', r)
        .classed("stateCircle", true);
    
    elemEnter.append("text")
        .attr("dx", d => xLinearScale(d[chosenXAxis]))
        .attr("dy", d => yLinearScale(d[chosenYAxis]))
        .classed("stateText", true)
        .attr("font-size", parseInt(r*0.8))
        .text(d => d.abbr);
  
    var xLabels = chartGroup.append("g")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`)
        .classed("atext", true)
        .attr("id", "xLabels");
    
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels)
    var enterXLabelsRect = xLabelsRect.enter()
        .append("rect")
        .attr("x", -120)
        .attr("y", (d,i) => (i+1)*axisPadding-12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenXAxis) ? true:false)
        .attr("value", d => "x"+d)
        .on("click", updateLabel);
    
    updateLabelsTooltip("x", enterXLabelsRect);
    xLabels.selectAll("text")
        .data(xAxisLabels)
        .enter()
        .append("text")
        .attr("x", 0)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d) 
        .classed("active", d => (d === chosenXAxis) ? true:false)
        .classed("inactive", d => (d === chosenXAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);

    var yLabels = chartGroup.append("g")
        .attr("transform", `rotate(-90 ${(margin.left/2)} ${(chartHeight/2)+60})`)
        .classed("atext", true)
        .attr("id", "yLabels");
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    var enterYLabelsRect = yLabelsRect.enter()
        .append("rect")
        .attr("x", -45)
        .attr("y", (d,i) => (i+1)*axisPadding-12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenYAxis) ? true:false)
        .attr("value", d => "y"+d)
        .on("click", updateLabel);
    updateLabelsTooltip("y", enterYLabelsRect);
    yLabels.selectAll("text")
        .data(yAxisLabels)
        .enter()
        .append("text")
        .attr("x", margin.top)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d)
        .classed("active", d => (d === chosenYAxis) ? true:false)
        .classed("inactive", d => (d === chosenYAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);

    var elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
};

d3.csv("/assets/data/data.csv").then((data, error) => {
    if (error) throw error;
  
    data.forEach(d => {
      d.poverty = +d.poverty;
      d.age = +d.age;
      d.income = +d.income;
      d.obesity = +d.obesity;
      d.healthcare = +d.healthcare;
      d.smokes = +d.smokes;
    });

    acsData = data;
    init();
});