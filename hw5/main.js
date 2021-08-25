import runAudioOnButtonClick from './scripts/runAudioOnButtonClick.js';
import fetchAndDecode from './scripts/fetchAndDecode.js';
import LinearMapper from './scripts/LinearMapper.js';
import GameTrak from './scripts/GameTrak.js';
import StereoRecorderNode from './scripts/StereoRecorderNode.js';
import WaveExporter from './scripts/WaveExporter.js';
import ToggleButton from './scripts/ToggleButton.js';

const createDownloadLink = (stereoRecorderNode) => {
  const use32Bit = false;
  const recordedBuffer = stereoRecorderNode.getRecordedBuffer();
  const blob = WaveExporter.createWavBlobFromChannelData(
    recordedBuffer, stereoRecorderNode.context.sampleRate, use32Bit);
  const anchorElement = document.createElement('a');
  anchorElement.className = 'file-download-link';
  anchorElement.href = window.URL.createObjectURL(blob);
  anchorElement.textContent = 'Right click and Save Link as';
  anchorElement.download =
    'export-' + (use32Bit ? '32bit' : '16bit') + '-'
    + (new Date()).toJSON() + '.wav';
  document.getElementById('audio-download-link').appendChild(anchorElement);
};

const main = async (event) => {
  const context = new AudioContext();


  const saw = new OscillatorNode(context, { type: 'sawtooth' });
  const lpf = new BiquadFilterNode(context, { Q: 8 });
  // const panner = new PannerNode(context, {panningModel: 'HRTF'});
  const amp = new GainNode(context, { gain: 0 });
  const irBuffer = await fetchAndDecode(context, './media/big-church.mp3');
  const reverb = new ConvolverNode(context, { buffer: irBuffer });
  await context.audioWorklet.addModule('./scripts/StereoRecorderProcessor.js');

  var vibrato = context.createOscillator();
  vibrato.frequency.value = 6;
  const vibratoGain = context.createGain();
  vibratoGain.gain.value = 8;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(saw.frequency);
  vibrato.start();

  const stereoRecorder = new StereoRecorderNode(context);
  saw.connect(lpf).connect(amp)
    .connect(reverb).connect(stereoRecorder).connect(context.destination);


  const gametrak = new GameTrak();
  const cutoff = new LinearMapper([-1, 1], [500, 3000]);
  const volume = new LinearMapper([-1.0, 1.0], [0.1, 0.5]);
  const vibratoMap = new LinearMapper([0, 1.0], [0, 8]);
  const viewDiv = document.getElementById('view');

  const timeConstant = 1 - Math.pow(Math.E, -0.01);
  const baseFundamental = 116.5;
  const baseLength = 148;
  const valve1length = 17.9;
  const valve2length = 8.6;
  const valve3length = 27.8;

  const valve3slidelength = 6;

  const speed = baseFundamental * baseLength;


  gametrak.setOnUpdate((pad) => {
    var axes = pad.axes;
    const now = context.currentTime;

    var length = baseLength;

    if (pad.buttons[1].pressed) length += valve1length;
    if (pad.buttons[2].pressed) length += valve2length;
    if (pad.buttons[3].pressed) length += valve3length;

    // length += Math.abs(axes[0]) * valve3slidelength;

    var fundamental = speed / length;

    var angle = Math.atan2(Math.pow(-axes[5], 3), Math.pow(-axes[2], 3)) * (180 / Math.PI);
    var overtone = Math.round((angle + 180) / 45) + 2;

    vibratoGain.gain.value = vibratoMap.map(Math.abs(-axes[0]))

    saw.frequency.setTargetAtTime(fundamental * overtone, now, timeConstant);
    lpf.frequency.setTargetAtTime(cutoff.map(axes[1]), now, timeConstant);
    amp.gain.setTargetAtTime((pad.buttons[7].pressed ? 0.5 : 0), now, timeConstant);

    viewDiv.textContent = `
      ${angle.toFixed(0)}
      ${length}
      X1: ${axes[0].toFixed(4)}
      Y1: ${axes[1].toFixed(4)}
      X2: ${axes[2].toFixed(4)}
      1: ${pad.buttons[0].pressed}
      2: ${pad.buttons[1].pressed}
      3: ${pad.buttons[2].pressed}
      4: ${pad.buttons[3].pressed}
    `;
  });

  const toggleButton = new ToggleButton(
    document.getElementById('btn-toggle-record'),
    (buttonEl) => {
      buttonEl.textContent = 'Stop';
      stereoRecorder.start();
    },
    (buttonEl) => {
      stereoRecorder.stop();
      context.suspend();
      buttonEl.textContent = 'Stopped';
      buttonEl.disabled = true;
      createDownloadLink(stereoRecorder);
    });
  toggleButton.set('Record', false);

  saw.start();
  gametrak.start();
};

runAudioOnButtonClick(main, 'btn-start');
