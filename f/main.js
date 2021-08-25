import runAudioOnButtonClick from './scripts/runAudioOnButtonClick.js';
import fetchAndDecode from './scripts/fetchAndDecode.js';
import LinearMapper from './scripts/LinearMapper.js';
import GameTrak from './scripts/GameTrak.js';
import StereoRecorderNode from './scripts/StereoRecorderNode.js';
import WaveExporter from './scripts/WaveExporter.js';
import ToggleButton from './scripts/ToggleButton.js';


var trumpetImg = new Image();
var slide = new Image();
var valve1 = new Image();
var valve2 = new Image();
var valve3 = new Image();

var valve1pressed = false;
var valve2pressed = false;
var valve3pressed = false;
var halfValve = false;
var valveslide = 0;

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


const trumpet = async (stream) => {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext({
    latencyHint: 'interactive',
    sampleRate: 44100,
  });


  const saw = new OscillatorNode(context, { type: 'sawtooth' });
  const lpf = new BiquadFilterNode(context, { Q: 8 });
  const amp = new GainNode(context, { gain: 0 });
  const irBuffer = await fetchAndDecode(context, './media/big-church.mp3');
  const reverb = new ConvolverNode(context, { buffer: irBuffer });
  await context.audioWorklet.addModule('./scripts/StereoRecorderProcessor.js');

  var vibrato = context.createOscillator();
  vibrato.frequency.value = 6;
  const vibratoGain = context.createGain();
  vibratoGain.gain.value = 0;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(saw.frequency);
  vibrato.start();

  const stereoRecorder = new StereoRecorderNode(context);
  saw.connect(lpf).connect(amp)
    .connect(reverb).connect(stereoRecorder).connect(context.destination);

  saw.connect(lpf).connect(amp).connect(stereoRecorder).connect(context.destination);



  const gametrak = new GameTrak();
  const cutoff = new LinearMapper([0.01, 0.5], [500, 1500]);
  const volume = new LinearMapper([0.01, 0.5], [0, 0.5]);
  const vibratoMap = new LinearMapper([0, 1.0], [0, 8]);
  const slideMap = new LinearMapper([0, 1.0], [0, 60]);
  const level = new LinearMapper([0, 1.0], [150, 0]);
  const viewDiv = document.getElementById('view');

  const timeConstant = 1 - Math.pow(Math.E, -0.01);
  const baseFundamental = 116.5;
  const baseLength = 148;
  const valve1length = 17.9;
  const valve2length = 8.6;
  const valve3length = 27.8;

  const valve3slidelength = 6;

  const speed = baseFundamental * baseLength;

  // Create an AudioNode from the stream.
  const mediaStreamSource = context.createMediaStreamSource(stream);
  const meter = createAudioMeter(context);
  mediaStreamSource.connect(meter);

  // Connect it to the destination to hear yourself (or any other node for processing!)
  // mediaStreamSource.connect(context.destination);


  gametrak.setOnUpdate((pad) => {
    var axes = pad.axes;
    const now = context.currentTime;

    var length = baseLength;

    if (pad.buttons[1].pressed) {
      length += valve1length;
      valve1pressed = true;
    } else {
      valve1pressed = false;
    }
    if (pad.buttons[2].pressed) {
      length += valve2length;
      valve2pressed = true;
    } else {
      valve2pressed = false;
    }
    if (pad.buttons[3].pressed) {
      length += valve3length;
      valve3pressed = true;
    } else {
      valve3pressed = false;
    }

    length += Math.abs(axes[0]) * valve3slidelength;

    valveslide = slideMap.map(Math.abs(axes[0]));

    var fundamental = speed / length;

    var angle = Math.atan2(Math.pow(-axes[5], 3), Math.pow(-axes[2], 3)) * (180 / Math.PI);
    var overtone = Math.round((angle + 180) / 45) + 2;

    // half valve
    if (pad.buttons[7].pressed) {
      overtone = (angle + 180) / 45 + 2;
      halfValve = true;
    } else {
      halfValve = false;
    }

    vibratoGain.gain.value = vibratoMap.map(Math.abs(axes[1]))

    saw.frequency.setTargetAtTime(fundamental * overtone, now, timeConstant);
    lpf.frequency.setTargetAtTime(cutoff.map(meter.volume), now, timeConstant);

    var volumeLevel = document.getElementById("micInput").checked ? Math.min(Math.max(volume.map(meter.volume), 0), 0.8) : 0.6;
    amp.gain.setTargetAtTime(volumeLevel, now, timeConstant);

    document.getElementById("meter1").style.height = level.map(meter.volume) + "px";
    viewDiv.textContent = `
      Overtone: ${overtone} 
      Fundamental frequency: ${(fundamental * overtone).toFixed(1)} hz
    `;

    window.requestAnimationFrame(draw);
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
}

const framesize = 600;

const draw = () => {
  var ctx = document.getElementById('canvas').getContext('2d');
  ctx.globalCompositeOperation = 'destination-over';
  ctx.clearRect(0, 0, framesize, framesize);
  ctx.drawImage(trumpetImg, 0, 0, framesize, framesize);
  ctx.drawImage(slide, 0, 0, framesize + valveslide, framesize);
  ctx.drawImage(valve1, 0, 0, framesize, framesize + (valve1pressed ? 20 : halfValve ? 10 : 0));
  ctx.restore();
  ctx.drawImage(valve2, 0, 0, framesize, framesize + (valve2pressed ? 20 : halfValve ? 10 : 0));
  ctx.drawImage(valve3, 0, 0, framesize, framesize + (valve3pressed ? 20 : halfValve ? 10 : 0));
  ctx.fillStyle = "#EEEEEE";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const main = async (event) => {
  trumpetImg.src = "./media/trumpet-01.png";
  slide.src = "./media/slide.png";
  valve1.src = "./media/valve1-01.png";
  valve2.src = "./media/valve2-01.png";
  valve3.src = "./media/valve3-01.png";

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  const constraints = {
    video: false,
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  }

  navigator.mediaDevices.getUserMedia(constraints).then(trumpet);
};

// runAudioOnButtonClick(main, 'btn-start');
main();