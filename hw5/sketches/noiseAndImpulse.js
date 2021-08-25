import createUtilityBuffer from './scripts/createUtilityBuffer.js';

const sampleRate = context.sampleRate;
const buffer = createUtilityBuffer('impulse', sampleRate, sampleRate);
console.log(buffer.getChannelData(0));
const bufferSource = new AudioBufferSourceNode(context, {buffer: buffer});
bufferSource.connect(context.destination);
bufferSource.start();