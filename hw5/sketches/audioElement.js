const audioElement = new Audio('./media/loop-1.wav');
audioElement.crossOrigin = 'anonymous';
audioElement.addEventListener('canplaythrough', () => {
  const mediaStream = audioElement.captureStream();
  const streamSource =
      new MediaStreamAudioSourceNode(context, {mediaStream: mediaStream});
  streamSource.connect(context.destination);
  audioElement.play();
});