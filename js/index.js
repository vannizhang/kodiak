require([
    "esri/views/SceneView",
    "esri/WebScene",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "dojo/domReady!"
  ], function(
    SceneView, WebScene,
    GraphicsLayer, Graphic
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
    
        const sceneView = new SceneView({
            map: scene,
            container: DOM_ID_SCENE_VIEW_CONTAINER,
        });

        const initGraphicLayer = ()=>{
            const graphicsLayer = new GraphicsLayer({id: 'gLayer'});
            scene.add(graphicsLayer);
        };

        const renderTripIndicatorPt = (x, y, z)=>{

            const gLayer = scene.findLayerById('gLayer');
            gLayer.removeAll();

            if(x || y || x){

                const pointGeom = {
                    type: "point", // autocasts as new Point()
                    x: x,
                    y: y,
                    z: z,
                    spatialReference: {
                        wkid: 3857,
                    }
                };
    
                const markerSymbol = {
                    type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                    color: [226, 119, 40],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [255, 255, 255],
                        width: 2
                    }
                };
        
                const pointGraphic = new Graphic({
                    geometry: pointGeom,
                    symbol: markerSymbol
                });
        
                gLayer.add(pointGraphic);
            }

        };

        sceneView.when(function(){
            initGraphicLayer();
            view.init();
        });

        return {
            renderTripIndicatorPt
        };

    };

    const View = function(){

        const $chartLegendDiv = document.getElementById('chartLegendDiv');
        const $valHolderDist = document.querySelectorAll('.val-holder-distance');
        const $valHolderElev = document.querySelectorAll('.val-holder-elevation');
        const $showOnHoverElem = document.querySelectorAll('.show-on-hover');

        this.chart = null;

        this.init = ()=>{
            this.chart = new ElevationProfileChart({
                containerID: DOM_ID_CHART_CONTAINER,
                data: helper.getElevationProfileData()
            });
        };

        this.showChartLegend = (distanceVal, elevationVal)=>{
            // $valHolderDist.text(`distance: ${distanceVal}km`);
            // $valHolderElev.text(`distance: ${elevationVal}m`);
            // $chartLegendDiv.toggleClass

            if(distanceVal && elevationVal){
                $valHolderDist.forEach(d=>{
                    d.textContent = `distance: ${distanceVal/1000}km`;
                });
    
                $valHolderElev.forEach(d=>{
                    d.textContent = `elevation: ${elevationVal}m`;
                });

                $showOnHoverElem.forEach(k=>{ k.classList.remove('hide'); })

            } else {
                $showOnHoverElem.forEach(k=>{ k.classList.add('hide'); })
            }
        };

    };

    const ElevationProfileChart = function(options){

        // set the dimensions and margins of the graph
        const container = options.containerID ? document.getElementById(options.containerID) : null;
        const margin = { top: 40, right: 20, bottom: 30, left: 45 };
        // const data = options.data;
        const data = options.data.map(d=>{
            return {
                x: d[0],
                y: d[1],
                z: d[2],
                profileLength: d[3]
            }
        });

        let width = container.offsetWidth  - margin.left - margin.right;
        let height = container.offsetHeight - margin.top - margin.bottom;

        let xScale = d3.scaleLinear()
            .range([0, width])
            .domain([ 0, data[data.length - 1].profileLength ]);

        // let fbExt = d3.extent(data, function(d) { return d[2]; });
        // console.log(fbExt);

        let yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([1500, d3.max(data, function(d) { return d.z; })]);

        // define the area
        let area = d3.area()
            .x(function(d) { return xScale(d.profileLength); })
            .y0(height)
            .y1(function(d) { return yScale(d.z); });

        // define the line
        let valueline = d3.line()
            .x(function(d) { return xScale(d.profileLength); })
            .y(function(d) { return yScale(d.z); });
        
        // let verticalReferenceLine = null;

        let svg = d3.select("#"+ options.containerID)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        let g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let focus = null;

        const getDataByXValue = function(xVal){

            const bisectDistanceFromOrigin = d3.bisector(d => d.profileLength).left;
            const i = bisectDistanceFromOrigin(data, xVal);
            const d0 = data[i - 1];
            const d1 = data[i];
            const outputData = xVal - d0.profileLength > d1.profileLength - xVal ? d1 : d0;

            return outputData;
        };

        const overlayOnMouseMoveHandler = function(){
            let mousePositionX = d3.mouse(this)[0];
            let xValueByMousePosition = xScale.invert(mousePositionX);
            let targetData = getDataByXValue(xValueByMousePosition);

            setFocus(targetData.profileLength, targetData.z);
            app.renderTripIndicatorPt(targetData.x, targetData.y, targetData.z + 20);
            // console.log('targetData', targetData);

            view.showChartLegend(Math.floor(targetData.profileLength), Math.floor(targetData.z));
        };

        const renderChart = ()=>{

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
                .call(d3.axisBottom(xScale).tickSizeOuter(-height));

            // add the Y Axis
            g.append("g")
                .call(d3.axisLeft(yScale).ticks(4).tickSizeOuter(0).tickSizeInner(-width));
        };

        const initFocus = ()=>{

            focus = g.append('g')
                .attr('class', 'focus')
                .style('display', 'none');
      
            focus.append('circle')
                .style('fill', 'rgba(230,230,230,.8)')
                .style('stroke', 'rgba(230,230,230,.6)')
                .attr('r', 3);
        
            focus.append('line')
                .classed('y', true)
                .attr('stroke', 'rgba(230,230,230,.6)');
        
            // focus.append('text')
            //     .attr('x', 9)
            //     .attr('dy', '.35em');

            // add a overlay to the background that we will use to handle mouse events
            g.append("rect")
                .attr('class', 'overlay')
                .attr("width", width)
                .attr("height", height)
                .style('fill', 'rgba(0,0,0,0)')
                .on("mousemove", overlayOnMouseMoveHandler)
                .on("mouseover", function() {
                    focus.style("display", null);
                })
                .on('mouseout', function(){
                    focus.style("display", "none");
                    app.renderTripIndicatorPt(null);
                    view.showChartLegend(null);
                });
        };

        const setFocus = (xVal, yVal)=>{

            const elevLabel = parseInt(+yVal) + ' ft';

            focus.attr('transform', `translate(${xScale(xVal)}, ${yScale(yVal)})`);

            focus.select('line.y')
              .attr('x1', 0)
              .attr('x2', 0)
              .attr('y1', 0)
              .attr('y2', height - yScale(yVal));

            // focus.select('text').text(elevLabel);
        };

        renderChart();
        initFocus();
    };

    const Helper = function(){
        
        this.getElevationProfileData = ()=>{

            let data = elevProfileData.results[0].value.features[0].geometry.paths;

            data = data.reduce((accu, curr)=>{
                return accu.concat(curr);
            }, []);

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