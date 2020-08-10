/**
* ref: https://bl.ocks.org/kerryrodden/7090426
**/

import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";
import d3Tip from 'd3-tip';
import _ from 'lodash';

export class SunburstChart extends React.Component {  
  constructor(props) {
    super(props);
    this.resetChartSize = this.resetChartSize.bind(this);
    this.init();
    this.prepareSunburstData(this.props.config.data);
    this.message = React.createRef();
    this.container = React.createRef();
  }

  componentDidMount() {
    this.resetChartSize();
    d3.select(this.svg).call(this.tooltip);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetChartSize);
  }

  componentWillReceiveProps(nextProps) {
    this.prepareSunburstData(nextProps.config.data);
  }

  componentDidUpdate(prevProps, prevState) {
    this.resetChartSize();
  }

  init() {
    this.svgMaxSize = {width: 450, height: 450};
    this.color = d3.scaleOrdinal(['green', 'red']);
    this.partition = d3.partition();
    this.format = d3.format(",.2%");
    this.formatCurrency =  d3.format(",.2f");
    this.x = d3.scaleLinear().range([0, 2 * Math.PI]);

    this.startAngle = (d) => {
      return Math.max(0, Math.min(2 * Math.PI, this.x(d.x0)))
    };

    this.endAngle = (d) => {
      return Math.max(0, Math.min(2 * Math.PI, this.x(d.x1)));
    };

    this.getColor = (d) => {
      return d.data.color;
    };

    this.innerRadius = (d) => {
      return Math.max(0, this.y(d.y0));
    };

    this.outerRadius = (d) => {
      return Math.max(0, this.y(d.y1));
    };

    this.midAngle = (d) => {
      const startAngle = this.startAngle(d);
      const endAngle = this.endAngle(d);
      return startAngle + (endAngle - startAngle)/2;
    };

    this.arc = d3.arc()
      .startAngle(this.startAngle)
      .endAngle(this.endAngle)
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius);
    
    this.tooltip = d3Tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html(this.getLabelText.bind(this));

    this.addResizeEvents();
  }

  getLabelText(d) {
    return `${d.data.name}: ${d.value}    ${this.format(d.value / this.totalSize)}`;
  }

  shouldShow(d) {
    let perc = 100;
    
    if(d.parent && d.parent.value > 0 && d.value > 0) {
      perc = (d.value / d.parent.value) * 100;
    }

    return d.depth === 1 && perc > 3 && this.containerWidth > 600;
  }

  addResizeEvents() {
    window.addEventListener('resize', this.resetChartSize);
  }

  getSvgSize() {
    const containerWidth = this.getContainerWidth();

    if (containerWidth >= this.svgMaxSize.width) {
      return this.svgMaxSize;
    }

    return {
      width: containerWidth,
      height: containerWidth,
    }
  }

  resetChartSize() {
    let message;

    if (_.isEmpty(this.props.config.data.children)) {
      d3.select('.paths').selectAll('*').remove();
      d3.select('.labels').selectAll('*').remove();
      d3.select('.lines').selectAll('*').remove();
      message = 'No Data';
      return ;
    } else {
      message = '';
    }

    if (this.message.current) {
      this.message.current.innerHTML = message;
    }

    this.size = this.getSvgSize();
    this.radius = Math.min(this.size.width, this.size.height) / 2;
    this.containerWidth = this.getContainerWidth();
    this.y = d3.scaleSqrt().range([0, this.radius]);

    this.sunburst = d3.select(this.svg)
      .attr('width', this.size.width)
      .attr('height', this.size.height)
      .select('g.sunburst')
        .attr('transform', `translate(${this.size.width / 2}, ${this.size.height * .52})`);
    
    this.drawSunbust();
  }

  prepareSunburstData(data) {
    this.root = d3.hierarchy(data)
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.value - a.value; });

    this.nodes = this.partition(this.root)
      .descendants()
      .filter(function(d) {
         return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
      });
  }

  getLengedsData() {
    const target = this.nodes[0].height > 1 ? 2 : 1;

    const data = this.nodes.filter((v, i) => {
      v.id = i;
      return v.depth === target;
    }).map((v) => {
      return Object.assign(v, {
        color: this.getColor(v),
        text: v.data.name,
      });
    });

    return data;
  }

  legendMouseOver(d, i) {
    this.mouseover(d, false);
  }

  lengedMouseOut() {
    this.mouseleave();
  }

  getContainerWidth() {
    return this.container.current && this.container.current.getBoundingClientRect().width;
  }

  drawSunbust() {
    this.totalSize = this.root.value;
    this.addPaths(this.nodes);
    this.addLabels(this.nodes);
    this.addLines(this.nodes);
    this.sunburst.on('mouseleave', this.mouseleave.bind(this));    
  }

  addLines(nodes) {
    let lines = this.sunburst.select('.lines')
      .selectAll('polyline')
      .data(nodes);

    lines.enter()
      .append('polyline')
      .style('stroke', this.getColor)
      .style('stroke-width', "0.5px")
      .style('fill', 'none')
    .merge(lines)
      .attr('points', (d) => {
        return this.polyLinePoints(d).points;
      })
      .style('display', (d) => {
        return this.shouldShow(d) ? 'block': 'none';
      });

    lines.exit().remove();
  }

  addPaths(nodes) {
    let paths = this.sunburst
      .select("g.paths")
      .selectAll('path')
      .data(nodes);

    let path = paths.enter()
      .append('path')
      .style("stroke", "#fff")
      .style("fill-rule", "evenodd")
      .on('mouseover', this.mouseover.bind(this))
      .on('click', (d) => {
        d3.event.stopPropagation();
        this.click(d)
      })
    .merge(paths)
      .attr("display", (d) => {
        return d.depth ? null : "none"; 
      }) // hide inner ring
      .style("fill", this.getColor)
      .attr("d", this.arc);

    paths.exit().remove();
    
    d3.select(this.svg).on('click', () => {
      this.click(nodes[0]);
    });
  }

  addLabels(nodes) {
    let texts = this.sunburst
      .select('.labels')
      .selectAll('text')
      .data(nodes);

    texts.enter()
      .append('text')
      .attr('dy', '-.35em')
    .merge(texts)
      .style('text-anchor', (d) => {
        return this.midAngle(d) > Math.PI ? 'start' : 'end';
      })
      .style('display', (d) => {
        return this.shouldShow(d) ? 'block': 'none';
      })
      .attr('transform', (d) => {
        let pos = this.polyLinePoints(d).end;
        return `translate(${pos})`;
      })
      .text(this.getLabelText.bind(this));

    texts.exit().remove();
  }

  polyLinePoints(d) {
    let centroid = this.arc.centroid(d);
    let inflection = [0,0];
    let end = [0,0];
    let distToChart = 20;
    let xDist = this.radius + distToChart;
    let lineWidth = this.containerWidth/2 - this.radius - distToChart; 
    
    if(centroid[0] > 0){
      // right of center
      inflection[0] = xDist;
      end[0] = inflection[0] + lineWidth;
    } else {
      // left of center
      inflection[0] = -xDist;
      end[0] = inflection[0] - lineWidth;
    }

    if(centroid[0] < 0 && centroid[1] > 0 || centroid[0] > 0 && centroid[1] < 0){
      inflection[1] = centroid[1] + (inflection[0]-centroid[0])*Math.tan((-1/12)*Math.PI);
    } else {
      inflection[1] = centroid[1] + (inflection[0]-centroid[0])*Math.tan((1/12)*Math.PI);
    }
    
    end[1] = inflection[1];

    return {
      points: centroid[0] + "," + centroid[1] + " " + inflection[0] + "," + inflection[1] + " " + end[0] + "," + end[1],
      end: end,
    };
  }

  click(d) {
    this.props.onFilter && this.props.onFilter(d);
    
    this.sunburst.transition()
      .duration(750)
      .tween("scale", () => {
        let xd = d3.interpolate(this.x.domain(), [d.x0, d.x1]),
          yd = d3.interpolate(this.y.domain(), [d.y0, 1]),
          yr = d3.interpolate(this.y.range(), [d.y0 ? 20 : 0, this.radius]);
        return (t) => {
          this.x.domain(xd(t)); 
          this.y.domain(yd(t)).range(yr(t)); 
        };
      })
    .selectAll("path")
      .attrTween("d", (d) => { 
        return () => { 
          return this.arc(d); 
        }; 
      });

    this.sunburst.selectAll('.labels, .lines')
      .style('display', () => {
        return d.depth === 0 ? 'block' : 'none'; 
      });
  }

  mouseleave() {
    this.sunburst
      .selectAll('path')
      .style('opacity', 1);

    this.tooltip.hide();
  }

  //Given a node in a partition layout, return an array of all of its ancestor
  // nodes, highest first, but excluding the root.
  getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  mouseover(d, showTip = true) {
    const percentage = (100 * d.value / this.totalSize).toPrecision(3);
    const percentageString = percentage + "%";
    const sequenceArray = this.getAncestors(d);

    // if (showTip) {
    //   this.tooltip.show(d);
    // }

    // Fade all the segments.
    this.sunburst.selectAll("path")
      .style("opacity", 0.3);
    
    // Then highlight only those that are an ancestor of the current segment.
    this.sunburst.selectAll("path")
      .filter(function(node) {
        return (sequenceArray.indexOf(node) >= 0);
      })
      .style("opacity", 1);
  }

  render() {
    return (
      <div className='sunburst-chart-container' ref={this.container}>
        <svg
          ref={(c) => {
            this.svg = c;
        }}>
        <g className='sunburst'>
          <g className='paths'></g>
          <g className='labels'></g>
          <g className='lines'></g>
        </g>
        </svg>

        <div className='error' ref={this.message}></div>
      </div>
    );
  }
}

SunburstChart.propTypes = {
  config: PropTypes.object.isRequired
};

