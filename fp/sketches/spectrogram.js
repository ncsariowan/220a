import Spectrogram from './scripts/Spectra.js';

const canvas = document.getElementById('spectrogram');
canvas.style.width = '600px';
canvas.style.height = '400px';
const context2D = canvas.getContext('2d');
const spectrogram = new Spectrogram(context2D);
spectrogram.setAudioBuffer(audioBuffer);
spectrogram.draw();
