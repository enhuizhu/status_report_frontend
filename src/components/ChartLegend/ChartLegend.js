import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";

class ChartLegend extends React.Component {  
  render() {
    return (
      <div className='legend-container'>
        {
          this.props.data.map((v, i) => {
            return (
              <div className="legend-item" key={i} 
                onMouseOver={this.props.mouseOver.bind(null, v, i)}
                onMouseOut={this.props.mouseOut}
              >
                <div className="legend-sq" style={{'background':v.color}}></div>
                <span className="legend-text">{v.text}</span>
              </div>
            );
          })
        }
        <div className="clearfix"></div>
      </div>
    );
  }
}

ChartLegend.propTypes = {
  data: PropTypes.array.isRequired,
  mouseOver: PropTypes.func,
  mouseOut: PropTypes.func,
};

ChartLegend.defaultProps = {
  mouseOver: ()=>{},
  mouseOut: ()=>{},
};

export default ChartLegend
