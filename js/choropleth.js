// Choropleth - comparing between different countries for edu indicators

/*
 *  choroplethMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _geoJSON         -- geoJSON map data
 *  @param _data            -- Array with all the education data
 */

choroplethMap = function(_parentElement, _geoJSON, _eduData) {
    this.parentElement = _parentElement;
    this.geoJSON = _geoJSON;
    this.eduData = _eduData;

    this.initVis();
    this.initRank();
}

/*
 *  Initialize Vis
 */

choroplethMap.prototype.initVis = function() {
    var vis = this;

    // * Creating svg
    vis.width = 1250;
    vis.height = 600;

    vis.mapWidth = 880;

    vis.svgMap = d3.select("#map").append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .attr("align", "center")
        .attr("id", "svg-map");

    vis.addInstruction = d3.select("#svg-map").append('text')
        .attr('x', vis.mapWidth/2+40)
        .attr('y', vis.height-25)
        .attr('class', 'map-instruction')
        .text("HOVER OVER EACH COUNTRY FOR MORE INFORMATION.");


    // *  Creating scales
        // color scale
        vis.colorScale = d3.scaleThreshold()
            .range(colorbrewer.GnBu[9]);


    // * Generate maps and project it on to svg
        // initiating map projection
        vis.projection = d3.geoMercator()
            .translate([vis.width*0.34, vis.height * 2 / 3])
            .scale([155]);

        // creating geopath for the maps
        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.mapPath = vis.svgMap.selectAll("path")
            .data(vis.geoJSON);


    // run updateChoropleth() function
    vis.updateChoropleth();

}




/*
 *  UpdateVis
 */

// * Implement Map
choroplethMap.prototype.updateChoropleth = function() {
    var vis = this;

    console.log(vis.geoJSON);
    console.log(vis.eduData);

    // gen var for selected indicators
    vis.selectedVar = d3.select("#map-select-var").property("value");
    console.log(vis.selectedVar);

    // gen selectedVar by country
    vis.varByCountry = {};
    vis.eduData.forEach(function(d){
        vis.varByCountry[d.countryname] = +d[vis.selectedVar];
        });

    // update colorscale domain
    var extent = d3.extent(vis.eduData, function(d) {
        return d[vis.selectedVar];
    });
    console.log(extent);

    var step = Math.floor((extent[1] - extent[0])/9);
    console.log(step);

    var legendSteps = d3.range(extent[0], extent[1], step);
    console.log(legendSteps);

    vis.colorScale.domain(legendSteps);

    // appending map
    vis.mapPath.enter().append("path")
        .merge(vis.mapPath)
        // .transition().duration(600)
        .attr("d", vis.path)
            .attr("class", "map")
            .style("fill", function(d){
                if(vis.varByCountry[d.properties.name] != 0){
                    return vis.colorScale(vis.varByCountry[d.properties.name]);
                } else {
                    return "#ededed";
                }
            })
        .attr('title', function(d){
            return "<b>" + d.properties.name + "</b>"+ "</br>" + showVariable(d)+ "</br><b>" + showData(d) +"</b>" ;
        });

    vis.mapPath.exit()
        .transition().duration(1200)
        .remove();

    function showVariable(){
        if(vis.selectedVar=="avg13_literacy1524") { return 'Literacy Rate (Age 15-24)';}
        if(vis.selectedVar=="avg13_pri_compt") { return "Primary School Completion Rate (%)" ;}
        if(vis.selectedVar=="avg13_pri_attain") { return 'Attainment Rate (at least Primary School) (%)' ;}
        if(vis.selectedVar=="avg13_sec_low_attain") { return 'Attainment Rate (at least Lower Secondary School) (%)'; }
        if(vis.selectedVar=="avg13_sec_up_attain") { return 'Attainment Rate (at least Upper Secondary School) (%)'; }
        if(vis.selectedVar=="avg13_bac_attain") { return "Attainment Rate (at least Bachelor's Degree) (%)"; }
        if(vis.selectedVar=="avg13_mas_attain") { return "Attainment Rate (at least Masters's Degree) (%)" ;}
        if(vis.selectedVar=="avg13_pri_enroll") { return "Enrollment Rate (Primary School) (%)" ;}
        if(vis.selectedVar=="avg13_sec_enroll") { return "Enrollment Rate (Secondary School) (%)" ;}
        if(vis.selectedVar=="avg13_ter_enroll") { return "Enrollment Rate (Tertiary School) (%)" ;}
        if(vis.selectedVar=="avg13_gov_edu") { return "Government Expenditure on education (% of GDP)" ;}
    }

    function showData(d){
        if(vis.varByCountry[d.properties.name]==0){
            return "Data Not Available" ;
        } else {
            // var info = vis.varByCountry[d.properties.name];
            return vis.varByCountry[d.properties.name] + " %";
            // return roundData(info) + " %";
        }
    };

    function roundData(data){
        return data.toFixed(2);
    }

    // adding tooltip to the maps

        // try with tooltipsy
        $('.map').tooltipsy({
            alignTo: 'cursor',
            offset: [10, 10],
            css: {
                'padding': '10px',
                'max-width': '200px',
                'color': '#fafafa',
                'background-color': 'rgba(101, 101, 101, .7)',
                'border': '0.1px solid #656565',
                'border-radius': '10px',
                '-moz-box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
                '-webkit-box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
                'box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
                'text-shadow': 'none'
            }
        });


    // appending legend
        var legend = vis.svgMap.selectAll('.legend')
            .data(vis.colorScale.range());

        legend.enter()
            .append('rect')
            .merge(legend)
            .attr('class', 'legend')
            .attr("x", 50)
            .attr("y", function (d, i) { return vis.height/1.5 + i * 16; })
            .attr("width", 14)
            .attr("height", 16)
            .style("fill", function (d) { return d; });

        legend.exit().remove();

    // Legend labels
        var legendLabel = vis.svgMap.selectAll('.legendLabel')
            .data(legendSteps);

        console.log(d3.format(".2s")(legendSteps[0]));

        legendLabel.enter()
            .append('text')
            .merge(legendLabel)
            .attr('class', 'legendLabel')
            .attr("x", 70)
            .attr("y", function (d, i) { return vis.height/1.5 + i * 16; })
            .attr("dy", "4px")
            .text(function (d, i) {
                if(vis.selectedVar=="avg13_gov_edu"){
                    if(i > 9 ) { return null; }
                    else { return i ? d3.format(".2s")(legendSteps[i]) : d3.format(".2s")(legendSteps[i]) + " " + "%"; }
                } else { return i ? d3.format(".2s")(legendSteps[i]) : d3.format(".2s")(legendSteps[i]) + " " + "%";}
            });

        legendLabel.exit().remove();

}



// RANKINGS //

/*
 *  Initialize Ranking
 */

choroplethMap.prototype.initRank = function() {
    var vis = this;
    console.log(vis.eduData);

    vis.boxTop = vis.svgMap.append("rect")
        .attr('x', vis.mapWidth+50)
        .attr('y', 20)
        .attr('class', 'background-box')
        .attr('height', vis.height/2 - 120)
        .attr('width', 235);

    vis.boxBottom = vis.svgMap.append("rect")
        .attr('x', vis.mapWidth+50)
        .attr('y', vis.height/2 - 70)
        .attr('class', 'background-box')
        .attr('height', vis.height/2 - 120)
        .attr('width', 235);

    vis.addTopTitle = vis.svgMap.append("text")
        .attr("x", vis.mapWidth + 90)
        .attr("y", 58)
        .attr("class", "rank-title")
        .text("TOP 5 COUNTRIES");

    vis.addBottomTitle = vis.svgMap.append("text")
        .attr("x", vis.mapWidth + 68)
        .attr("y", vis.height/2 -32)
        .attr("class", "rank-title")
        .text("BOTTOM 5 COUNTRIES");

    vis.addNote = vis.svgMap
        .append('text')
            .attr('x', vis.mapWidth +50)
            .attr('y', vis.height*0.8)
            .attr('class', 'rank-note')
            .text("NOTE:")
        .append('tspan')
            .text("1 - The ranking is based on available data.")
            .attr('x', vis.mapWidth + 55).attr('y', vis.height*0.8 +20)
        .append('tspan')
            .text("2 - Grey areas indicate no date available.")
            .attr('x', vis.mapWidth + 55).attr('y', vis.height*0.8 +35)
        .append('tspan')
            .text("3 - Enrollment rate shown is gross enrollment, which ")
            .attr('x', vis.mapWidth +55).attr('y', vis.height*0.8 +50)
        .append('tspan')
            .text("include people who may have repeated a grade.")
            .attr('x', vis.mapWidth +68).attr('y', vis.height*0.8 +63);

    vis.wrangleRankData();
}



/*
 *  Data wrangling
 */

choroplethMap.prototype.wrangleRankData = function() {
    var vis = this;

    vis.displayData = vis.eduData;

    // gen var for selected indicators
    var selectedVar = d3.select("#map-select-var").property("value");

    // Top 5
    // sort selected var
    vis.topData = vis.displayData.sort(function(a, b){
        return d3.descending(a[selectedVar], b[selectedVar])
    });

    // only select top 5
    vis.filteredTop = vis.topData.filter(function(d,i){
        return i < 5;
    });

    console.log(vis.filteredTop);


    // Bottom 5
    vis.bottomData = vis.displayData.sort(function(a, b){
        return d3.ascending(a[selectedVar], b[selectedVar]);
    });

    // only select top 5
    vis.filteredBottom = vis.bottomData.filter(function(d){
        if(d[selectedVar]!=0 ) return true;
        else return false;
    }).filter(function(d, i){
        return i < 5;
    });

    console.log(vis.filteredBottom);


    vis.updateRank();

}

/*
 *  UpdateVis
 */

choroplethMap.prototype.updateRank = function() {
    var vis = this;

    vis.rankGap = 23;

    vis.addTop5 = d3.select("#svg-map")
        .append('text')
        .attr("class", 'rank-text')
        .attr('id', 'top5-text');

    vis.addBottom5 = d3.select('#svg-map')
        .append('text')
        .attr("class", 'rank-text')
        .attr('id', 'bottom5-text');


    vis.addTop5
    // .data(vis.filteredTop).enter()
    // .merge(vis.addTop5)
    // .transition()
    // .duration(1000)
        .text(function(){ return "1. " + vis.filteredTop[0].countryname; })
        .attr("x", vis.mapWidth + 85).attr("y", 65 + vis.rankGap*1 )
        .append('tspan')
        .text(function(){ return "2. " + vis.filteredTop[1].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", 65 + vis.rankGap*2)
        .append('tspan')
        .text(function(){ return "3. " + vis.filteredTop[2].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", 65 + vis.rankGap*3)
        .append('tspan')
        .text(function(){ return "4. " + vis.filteredTop[3].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", 65 + vis.rankGap*4)
        .append('tspan')
        .text(function(){ return "5. " + vis.filteredTop[4].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", 65 + vis.rankGap*5);

    vis.addBottom5
    // .data(vis.filteredBottom).enter()
    // .merge(vis.addBottom5)
    // .transition()
    // .duration(1500)
        .text(function(){ return "1. " + vis.filteredBottom[0].countryname; })
        .attr("x", vis.mapWidth + 85).attr("y", vis.height/2 -25 + vis.rankGap*1)
        .append('tspan')
        .text(function(){ return "2. " + vis.filteredBottom[1].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", vis.height/2 -25 + vis.rankGap*2)
        .append('tspan')
        .text(function(){ return "3. " + vis.filteredBottom[2].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", vis.height/2 -25 + vis.rankGap*3)
        .append('tspan')
        .text(function(){ return "4. " + vis.filteredBottom[3].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", vis.height/2 -25 + vis.rankGap*4)
        .append('tspan')
        .text(function(){ return "5. " + vis.filteredBottom[4].countryname; })
        .attr('x', vis.mapWidth + 85).attr("y", vis.height/2 -25 + vis.rankGap*5);


}

choroplethMap.prototype.textRemove = function(){
    var vis = this;

    vis.addTop5.remove();
    vis.addBottom5.remove();

    vis.wrangleRankData();
}
