class LinearMapper {
  constructor(domain, range) {
    console.assert(domain.length === 2);
    console.assert(range.length === 2);
    console.assert(domain[0] !== domain[1]);
    this.domain = domain;
    this.range = range;
    this.coefficent =
        (this.range[1] - this.range[0]) / (this.domain[1] - this.domain[0]);
  }

  map(value) {
    return this.range[0] + (value - this.domain[0]) * this.coefficent;
  }
}

export default LinearMapper;
