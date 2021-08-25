const createUniformNoiseBuffer = (length, sampleRate) => {
  const buffer = new AudioBuffer({length, sampleRate});
  const channelData = buffer.getChannelData(0);
  for (let index = 0; index < channelData.length; ++index) {
    channelData[index] = Math.random() - 0.5;
  }
  return buffer;
};

const createGaussianNoiseBuffer = (length, sampleRate) => {
  const buffer = new AudioBuffer({length, sampleRate});
  const channelData = buffer.getChannelData(0);
  for (let index = 0; index < channelData.length; ++index) {
    const r1 = Math.log(Math.random());
    const r2 = Math.PI * Math.random();
    channelData[index] = Math.sqrt(-2.0 * r1) * Math.cos(2.0 * r2) * 0.5;    
  }
  return buffer;
};

const createPinkNoiseBuffer = (length, sampleRate) => {
  const pA = [3.8024, 2.9694, 2.5970, 3.0870, 3.4006];
  const pSum = [0.00198, 0.01478, 0.06378, 0.23378, 0.91578];
  const contrib = [0.0, 0.0, 0.0, 0.0, 0.0];
  const pASum = 15.8564;
  
  const buffer = new AudioBuffer({length, sampleRate});
  const channelData = buffer.getChannelData(0);
  let value = 0;
  for (let index = 0; index < channelData.length; index++) {
    const uniformRandomValue1 = Math.random();
    const uniformRandomValue2 = Math.random();
    for (let interation = 0; interation < 5; ++interation) {
      if (uniformRandomValue1 <= pSum[interation]) {
        value -= contrib[interation];
        contrib[interation] = 2 * (uniformRandomValue2 - 0.5) * pA[interation];
        value += contrib[interation];
        break;
      }
    }
    channelData[index] = value / pASum;  
  }
  return buffer;
};

const createImpulseBuffer = (length, sampleRate) => {
  const buffer = new AudioBuffer({length, sampleRate});
  const channelData = buffer.getChannelData(0);
  channelData.fill(0);
  channelData[0] = 1;
  return buffer;
}

const createUtilityBuffer = (type, length, sampleRate) => {
  switch (type) {
    case 'uniform':
      return createUniformNoiseBuffer(length, sampleRate);
    case 'gaussian':
      return createGaussianNoiseBuffer(length, sampleRate);
    case 'pink':
      return createPinkNoiseBuffer(length, sampleRate);
    case 'impulse':
      return createImpulseBuffer(length, sampleRate);
    default:
      console.error('NOTREACHED');
  }
};

export default createUtilityBuffer;
