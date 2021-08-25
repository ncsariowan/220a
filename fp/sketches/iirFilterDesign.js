const sampleRate = context.sampleRate;
  const impulseBuffer = createUtilityBuffer('uniform', sampleRate, sampleRate);
  const sourceNode =
      new AudioBufferSourceNode(context, {buffer: impulseBuffer});

  // The coefficient 𝑎0 MUST not be 0 (feedback).
  const feedback = [1.0317185917, -1.9949273033, 0.9682814083];
  // At least one of 𝑏𝑚 MUST be non-zero (feedforward).
  const feedforward = [0.0012681742, 0.0025363483, 0.0012681742];
  const iirFilter = new IIRFilterNode(context, {feedforward, feedback});

  sourceNode.loop = true;
  sourceNode.connect(iirFilter).connect(context.destination);
  sourceNode.start();
  