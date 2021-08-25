/**
 * Example:
 * const audioBuffer = await fetchAndDecode(context, './media/loop-1.wav');
 * const source = new AudioBufferSourceNode(context, {buffer: audioBuffer});
 */
const fetchAndDecode = async (audioContext, url) => {
  console.assert(audioContext instanceof AudioContext);

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error('[fetchAndDecode] ' + error.message);
  }
};

export default fetchAndDecode;
