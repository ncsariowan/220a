import FFT from './FFT.js';

const DEFAULT_OPTIONS = {
  fftSize: 1024,
  smoothingCoefficient: 0.8
};

/**
 * Example:
 * const canvas = document.getElementById('spectrogram');
 * canvas.style.width = '480px';
 * canvas.style.height = '240px';
 * const context2D = canvas.getContext('2d');
 * const spectrogram = new Spectra(context2D, 1024);
 * spectrogram.setAudioBuffer(audioBuffer);
 * spectrogram.draw();
 */

const generateBlackmanWindow = (windowSize) => {
  const alpha = 0.16;
  const a0 = 0.5 * (1 - alpha);
  const a1 = 0.5;
  const a2 = 0.5 * alpha;
  const twoPI = Math.PI * 2.0;
  const blackmanWindow = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    const x = i / windowSize;
    blackmanWindow[i] =
        a0 - a1 * Math.cos(twoPI * x) + a2 * Math.cos(twoPI * 2 * x);
  }
  
  return blackmanWindow;
}

const hue2rgb = (p, q, t) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  // TODO: do not create a new array.
  return [r, g, b];
}

const plotValueToImageData = (value, imageData, x, y, yScale) => {
  const rgbValue = hslToRgb(value, 1.0, value);
  var index = (x + y * yScale) * 4;
  imageData.data[index + 0] = Math.round(rgbValue[0] * 255);
  imageData.data[index + 1] = Math.round(rgbValue[1] * 255);
  imageData.data[index + 2] = Math.round(rgbValue[2] * 255);
  imageData.data[index + 3] = 255;
}

/**
 * @class Spectrogram
 */
class Spectrogram {
  constructor(context2D, options = DEFAULT_OPTIONS) {
    this.context2D = context2D;
    
    this.fftSize = options.fftSize;
    this.FFT = new FFT(Math.log2(options.fftSize));
    this.reals = new Float32Array(options.fftSize);
    this.imags = new Float32Array(options.fftSize);
    this.temp = new Float32Array(options.fftSize);
    this.mags = new Float32Array(options.fftSize / 2);
    this.fftWindow = generateBlackmanWindow(options.fftSize);

    this.smoothingCoefficient = options.smoothingCoefficient ||
                                DEFAULT_OPTIONS.smoothingCoefficient;

    this.channelData = null;
    this.canvasOffscreen = null;
    this.context2DOffscreen = null;
  }

  setAudioBuffer(audioBuffer) {
    console.assert(audioBuffer instanceof AudioBuffer);

    // Note that this downmix the audioBuffer into mono channel.
    const channels = audioBuffer.numberOfChannels;
    this.channelData = new Float32Array(audioBuffer.length);
    for (let channel = 0; channel < channels; ++channel) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let index = 0; index < channelData.length; index++) {
        this.channelData[index] += channelData[index] / channels;
      }
    }
  }

  renderToOffscreenCanvas_() {
    // We don't need bins beyond the nyquist frequency.
    const halfOfBins = this.fftSize / 2;
    const hopSize = halfOfBins;
    const numberOfHops = Math.floor(this.channelData.length / halfOfBins);

    this.canvasOffscreen = document.createElement('canvas');
    this.canvasOffscreen.width = numberOfHops;
    this.canvasOffscreen.height = halfOfBins;
    this.context2DOffscreen = this.canvasOffscreen.getContext('2d');
    const offscreenImageData =
        this.context2DOffscreen.getImageData(0, 0, numberOfHops, halfOfBins);

    const magnitudeScaler = 1.0 / this.fftSize;
    const tempFrame = new Float32Array(this.fftSize);
    for (let hopIndex = 0; hopIndex < numberOfHops; ++hopIndex) {
      const hopOffset = hopIndex * hopSize;
      const fftFrame =
          this.channelData.subarray(hopOffset, hopOffset + this.fftSize);
      for (let index = 0; index < fftFrame.length; ++index) {
        tempFrame[index] = fftFrame[index] * this.fftWindow[index];
      }
      this.FFT.rfft(tempFrame, this.reals, this.imags);
      for (let binIndex = 0; binIndex < halfOfBins; ++binIndex) {
        const magnitude =
            Math.sqrt(this.reals[binIndex] * this.reals[binIndex] + 
                      this.imags[binIndex] * this.imags[binIndex]);
        const decibel = 20 * Math.log(magnitudeScaler * magnitude + 1);
        // Smoothing over time.
        this.mags[binIndex] =
            this.mags[binIndex] * (1 - this.smoothingCoefficient) +
            decibel * this.smoothingCoefficient;
        plotValueToImageData(this.mags[binIndex], offscreenImageData,
                             hopIndex, binIndex, numberOfHops);
      }
    }

    this.context2DOffscreen.putImageData(offscreenImageData, 0, 0);
  }

  draw() {
    console.assert(this.channelData instanceof Float32Array);

    this.renderToOffscreenCanvas_();

    const width = this.context2D.canvas.width;
    const height = this.context2D.canvas.height;
    const halfOfBins = this.fftSize / 2;

    this.context2D.fillStyle = '#ffffff';
    this.context2D.fillRect(0, 0, width, height);

    // Invert over x-axis for drawing on the actual canvas.
    this.context2D.setTransform(1, 0, 0, -1, 0, height);

    const logMaxY = Math.log(halfOfBins - 1, 2);
    let lastY = 0;

    // Scan top-down (0 -> halfOfBins - 1) and transform the Y coord by
    // logarithmic scale.
    for (let y = 1; y < halfOfBins; ++y) {
      const logY = Math.floor(height * Math.log(y, 2) / logMaxY);
      this.context2D.drawImage(this.canvasOffscreen,
          0, y - 1, this.canvasOffscreen.width, 1,
          0, lastY, width, logY - lastY);
      lastY += logY - lastY;
    }

    // Linear scale rendering
    // this.context2D.drawImage(this.canvasOffscreen,
    //     0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height,
    //     0, 0, width, height);
  }
}

// export default Spectra;
export default Spectrogram;