import _ from 'lodash';

class SunburstDataProcesser {
  static parse(data, target) {
    let obj = {
      name: 'Total',
      children: this.getChildren(data,target),
    }
    
    return obj;
  }


  static getChildren(v, target) {
    let children = [];
      
    _.each(v, (cv, ck) => {
      if(Object.keys(cv)[0] === target) {
        children.push({
          name: ck,
          size: cv[target].sum,
        });
      } else {
        children.push({
          name: ck,
          children: this.getChildren(cv, target),
        });
      }
    });

    return children;
  }
}

export default SunburstDataProcesser;
