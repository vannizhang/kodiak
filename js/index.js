require([
    "esri/views/SceneView",
    "esri/WebScene",
    "dojo/domReady!"
  ], function(
    SceneView, WebScene
  ) {

    'use strict';

    const WEB_SCENE_ID = '52aac1d28f504a55a475bdd6f8d6127b';
    const DOM_ID_SCENE_VIEW_CONTAINER = 'viewDiv';
    const DOM_ID_CHART_CONTAINER = 'elevationProfileChartDiv';

    const App = function(){

        const scene = new WebScene({
            portalItem: { // autocasts as new PortalItem()
                id: WEB_SCENE_ID
            }
        });
    
        const view = new SceneView({
            map: scene,
            container: DOM_ID_SCENE_VIEW_CONTAINER,
        });

    };

    const View = function(){

        this.chart = new ElevationProfileChart({
            containerID: DOM_ID_CHART_CONTAINER,
            data: helper.getElevationProfileData()
        });

    };

    const ElevationProfileChart = function(options){

        // set the dimensions and margins of the graph
        const container = options.containerID ? document.getElementById(options.containerID) : null;
        const margin = { top: 20, right: 20, bottom: 30, left: 50 };
        const data = options.data;

        let width = container.offsetWidth  - margin.left - margin.right;
        let height = container.offsetHeight - margin.top - margin.bottom;

        let xScale = d3.scaleLinear()
            .range([0, width])
            .domain([ 0, data[data.length - 1][3] ]);

        // let fbExt = d3.extent(data, function(d) { return d[2]; });
        // console.log(fbExt);

        let yScale = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(data, function(d) { return d[2]; }));

        // define the area
        let area = d3.area()
            .x(function(d) { return xScale(d[3]); })
            .y0(height)
            .y1(function(d) { return yScale(d[2]); });

        // define the line
        let valueline = d3.line()
            .x(function(d) { return xScale(d[3]); })
            .y(function(d) { return yScale(d[2]); });

        let svg = d3.select("#"+ options.containerID)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        let g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // add the area
        g.append("path")
            .data([data])
            .attr("class", "area")
            .attr("d", area);
            // .on('click', function(d){
            //     console.log(this);
            // });

        // add the valueline path.
        g.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline);

        // add the X Axis
        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        // add the Y Axis
        g.append("g")
            .call(d3.axisLeft(yScale));
        

        // console.log('generate ElevationProfileChart', options)
        // console.log(width, height);
    };

    const Helper = function(){
        
        this.getElevationProfileData = ()=>{

            let data = elevProfileData.results[0].value.features[0].geometry.paths;

            data = data.reduce((accu, curr)=>{
                return accu.concat(curr);
            }, []);

            console.log(data);
            return data;
        };

        this.getElevationProfileLength = ()=>{
            return elevProfileData.results[0].value.features[0].attributes.ProfileLength;
        };
    };

    const helper = new Helper();
    const app = new App();
    const view = new View();
    

});