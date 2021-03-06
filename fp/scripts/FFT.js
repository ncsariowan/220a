/**
 * @class FFT
 * @description Create an FFT object of order |order|.  This will compute 
 *   forward and inverse FFTs of length 2^|order|.
 * @param {Number} order FFT length(2^order).
 */
function FFT(order) {
  if (order <= 1)
    throw new this.FFTException(order);

   this.order = order;
   this.N = 1 << order;
   this.halfN = 1 << (order - 1);

   // Internal variables needed for computing each stage of the FFT.
   this.pairsInGroup = 0;
   this.numberOfGroups = 0;
   this.distance = 0;
   this.notSwitchInput = 0;

   // Work arrays
   this.aReal = new Float32Array(this.N);
   this.aImag = new Float32Array(this.N);
   this.debug = 0;

   // Twiddle tables for the FFT.
   this.twiddleCos = new Float32Array(this.N);
   this.twiddleSin = new Float32Array(this.N);

   var omega = -2 * Math.PI / this.N;
   for (var k = 0; k < this.N; ++k) {
      this.twiddleCos[k] = Math.fround(Math.cos(omega * k));
      this.twiddleSin[k] = Math.fround(Math.sin(omega * k));
   }
}

FFT.prototype.FFTException = function (order) {
  this.value = order;
  this.message = "Order must be greater than 1: ";
  this.toString = function () {
    return this.message + this.value;
  };
};

/**
 * Core routine that does one stage of the FFT, implementing all of the 
 *   butterflies for that stage.
 * @param {Float32Array} aReal Array of real number.
 * @param {Float32Array} aImag Array of imaginary number.
 * @param {Float32Array} bReal Array of real number.
 * @param {Float32Array} bImag Array of imaginary number.
 */
FFT.prototype.FFTRadix2Core = function (aReal, aImag, bReal, bImag) {
  var index = 0;
  for (var k = 0; k < this.numberOfGroups; ++k) {
    var jfirst = 2 * k * this.pairsInGroup;
    var jlast = jfirst + this.pairsInGroup - 1;
    var jtwiddle = k * this.pairsInGroup;
    var wr = this.twiddleCos[jtwiddle];
    var wi = this.twiddleSin[jtwiddle];
    for (var j = jfirst; j <= jlast; ++j) {      
      var idx = j + this.distance;
      var tr = wr * aReal[idx] - wi * aImag[idx];
      var ti = wr * aImag[idx] + wi * aReal[idx];
      bReal[index] = aReal[j] + tr;
      bImag[index] = aImag[j] + ti;
      bReal[index + this.halfN] = aReal[j] - tr;
      bImag[index + this.halfN] = aImag[j] - ti;
      ++index;
    }
  }
};

/**
 * Forward out-of-place complex FFT.
 * @param  {[type]} xr    [description]
 * @param  {[type]} xi    [description]
 * @param  {[type]} bReal [description]
 * @param  {[type]} bImag [description]
 * @return {[type]}       [description]
 * 
 * Computes the forward FFT, b,  of a complex vector x:
 *   b[k] = sum(x[n] * W^(k*n), n, 0, N - 1), k = 0, 1,..., N-1
 *
 * where,
 *   N = length of x, which must be a power of 2
 *   W = exp(-2*i*pi/N)
 *   x = |xr| + i*|xi|
 *   b = |bReal| + i*|bImag|
 */
FFT.prototype.fft = function (xr, xi, bReal, bImag) {
  this.pairsInGroup = this.halfN;
  this.numberOfGroups = 1;
  this.distance = this.halfN;
  this.notSwitchInput = true;

  // Arrange it so that the last iteration puts the desired output
  // in bReal/bImag.
  if ((this.order & 1) === 1) {
    this.FFTRadix2Core(xr, xi, bReal, bImag);
    this.notSwitchInput = !this.notSwitchInput;
  } else {
    this.FFTRadix2Core(xr, xi, this.aReal, this.aImag);
  }

  this.pairsInGroup >>= 1;
  this.numberOfGroups <<= 1;
  this.distance >>= 1;

  while (this.numberOfGroups < this.N) {
    if (this.notSwitchInput) {
      this.FFTRadix2Core(this.aReal, this.aImag, bReal, bImag);
    } else {
      this.FFTRadix2Core(bReal, bImag, this.aReal, this.aImag);
    }

    this.notSwitchInput = !this.notSwitchInput;
    this.pairsInGroup >>= 1;
    this.numberOfGroups <<= 1;
    this.distance >>= 1;
  }
};

/**
 * Core routine that does one stage of the FFT, implementing all of the 
 * butterflies for that stage.  This is identical to FFTRadix2Core, except the 
 * twiddle factor, w, is the conjugate.
 * @param  {Float32Array} aReal [description]
 * @param  {Float32Array} aImag [description]
 * @param  {Float32Array} bReal [description]
 * @param  {Float32Array} bImag [description]
 */
FFT.prototype.iFFTRadix2Core = function (aReal, aImag, bReal, bImag) {
  var index = 0;
  for (var k = 0; k < this.numberOfGroups; ++k) {
    var jfirst = 2 * k * this.pairsInGroup;
    var jlast = jfirst + this.pairsInGroup - 1;
    var jtwiddle = k * this.pairsInGroup;
    var wr = this.twiddleCos[jtwiddle];
    var wi = -this.twiddleSin[jtwiddle];

    for (var j = jfirst; j <= jlast; ++j) {
      var idx = j + this.distance;
      var tr = wr * aReal[idx] - wi * aImag[idx];
      var ti = wr * aImag[idx] + wi * aReal[idx];

      bReal[index] = aReal[j] + tr;
      bImag[index] = aImag[j] + ti;
      bReal[index + this.halfN] = aReal[j] - tr;
      bImag[index + this.halfN] = aImag[j] - ti;
      ++index;
    }
  }
};

/**
 * Inverse out-of-place complex FFT.
 * @param  {[type]} xr    [description]
 * @param  {[type]} xi    [description]
 * @param  {[type]} bReal [description]
 * @param  {[type]} bImag [description]
 * @return {[type]}       [description]
 *
 * Computes the inverse FFT, b,  of a complex vector x:
 *   b[k] = sum(x[n] * W^(-k*n), n, 0, N - 1), k = 0, 1,..., N-1
 *
 * where,
 *   N = length of x, which must be a power of 2
 *   W = exp(-2*i*pi/N)
 *   x = |xr| + i*|xi|
 *   b = |bReal| + i*|bImag|
 *
 * Note that ifft(fft(x)) = N * x.  To get x, call ifftScale to scale the output
 * of the ifft appropriately.
 */
FFT.prototype.ifft = function (xr, xi, bReal, bImag) {
  this.pairsInGroup = this.halfN;
  this.numberOfGroups = 1;
  this.distance = this.halfN;
  this.notSwitchInput = true;

  // Arrange it so that the last iteration puts the desired output
  // in bReal/bImag.
  if ((this.order & 1) === 1) {
    this.iFFTRadix2Core(xr, xi, bReal, bImag);
    this.notSwitchInput = !this.notSwitchInput;
  } else {
    this.iFFTRadix2Core(xr, xi, this.aReal, this.aImag);
  }

  this.pairsInGroup >>= 1;
  this.numberOfGroups <<= 1;
  this.distance >>= 1;

  while (this.numberOfGroups < this.N) {

    if (this.notSwitchInput) {
      this.iFFTRadix2Core(this.aReal, this.aImag, bReal, bImag);
    } else {
      this.iFFTRadix2Core(bReal, bImag, this.aReal, this.aImag);
    }

    this.notSwitchInput = !this.notSwitchInput;
    this.pairsInGroup >>= 1;
    this.numberOfGroups <<= 1;
    this.distance >>= 1;
  }
};

/**
 * Scales the IFFT by 1/N, done in place.
 * @param  {[type]} xr [description]
 * @param  {[type]} xi [description]
 */
FFT.prototype.ifftScale = function (xr, xi) {
  var factor = 1 / this.N;
  for (var k = 0; k < this.N; ++k) {
    xr[k] *= factor;
    xi[k] *= factor;
  }
};

/**
 * First stage for the RFFT.  Basically the same as FFTRadix2Core, but we assume
 * aImag is 0, and adjust the code accordingly.
 * @param {[type]} aReal [description]
 * @param {[type]} bReal [description]
 * @param {[type]} bImag [description]
 */
FFT.prototype.RFFTRadix2CoreStage1 = function (aReal, bReal, bImag) {
  var index = 0;
  for (var k = 0; k < this.numberOfGroups; ++k) {
    var jfirst = 2 * k * this.pairsInGroup;
    var jlast = jfirst + this.pairsInGroup - 1;
    var jtwiddle = k * this.pairsInGroup;
    var wr = this.twiddleCos[jtwiddle];
    var wi = this.twiddleSin[jtwiddle];

    for (var j = jfirst; j <= jlast; ++j) {
      var idx = j + this.distance;
      var tr = wr * aReal[idx];
      var ti = wi * aReal[idx];

      bReal[index] = aReal[j] + tr;
      bImag[index] = ti;
      bReal[index + this.halfN] = aReal[j] - tr;
      bImag[index + this.halfN] = -ti;
      ++index;
    }
  }
};

/**
 * Forward Real FFT.  Like fft, but the signal is assumed to be real, so the 
 * imaginary part is not supplied.  The output, however, is still the same and 
 * is returned in two arrays.  (This could be optimized to use less storage, 
 * both internally and for the output, but we don't do that.)
 * @param  {[type]} xr    [description]
 * @param  {[type]} bReal [description]
 * @param  {[type]} bImag [description]
 */
FFT.prototype.rfft = function (xr, bReal, bImag) {
  this.pairsInGroup = this.halfN;
  this.numberOfGroups = 1;
  this.distance = this.halfN;
  this.notSwitchInput = true;

  // Arrange it so that the last iteration puts the desired output
  // in bReal/bImag.
  if ((this.order & 1) === 1) {
    this.RFFTRadix2CoreStage1(xr, bReal, bImag);
    this.notSwitchInput = !this.notSwitchInput;
  } else {
    this.RFFTRadix2CoreStage1(xr, this.aReal, this.aImag);
  }

  this.pairsInGroup >>= 1;
  this.numberOfGroups <<= 1;
  this.distance >>= 1;

  while (this.numberOfGroups < this.N) {
    if (this.notSwitchInput)
      this.FFTRadix2Core(this.aReal, this.aImag, bReal, bImag);
    else
      this.FFTRadix2Core(bReal, bImag, this.aReal, this.aImag);

    this.notSwitchInput = !this.notSwitchInput;
    this.pairsInGroup >>= 1;
    this.numberOfGroups <<= 1;
    this.distance >>= 1;
  }
};

export default FFT;