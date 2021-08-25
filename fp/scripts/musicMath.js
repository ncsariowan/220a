/**
 * Clamps a number into a range specified by min and max.
 * @param  {Number} value Value to be clamped
 * @param  {Number} min   Range minimum
 * @param  {Number} max   Range maximum
 * @return {Number}       Clamped value
 */
const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generates a floating point random number between min and max.
 * @param  {Number} min Range minimum
 * @param  {Number} max Range maximum
 * @return {Number}     A floating point random number
 */
const random2f = (min, max) => {
  return min + Math.random() * (max - min);
}

/**
 * Generates an integer random number between min and max.
 * @param  {Number} min Range minimum
 * @param  {Number} max Range maximum
 * @return {Number}     An integer random number
 */
const random2 = (min, max) => {
  return Math.round(min + Math.random() * (max - min));
};

/**
 * Converts a MIDI pitch number to frequency.
 * @param  {Number} midi MIDI pitch (0 ~ 127)
 * @return {Number}      Frequency (Hz)
 */
const mtof = (midiPitch) => {
  if (midiPitch <= -1500) return 0;
  if (midiPitch > 1499) return 3.282417553401589e+38;
  return 440.0 * Math.pow(2, (Math.floor(midiPitch) - 69) / 12.0);
};

/**
 * Converts frequency to MIDI pitch.
 * @param  {Number} freq Frequency
 * @return {Number}      MIDI pitch
 */
const ftom = (freq) => {
  const midiPitch =
      freq > 0 ? Math.log(freq/440.0) / Math.LN2 * 12 + 69 : -1500;
  return Math.floor(midiPitch);
};

/**
 * Converts power to decibel. Note that it is off by 100dB to make it
 *   easy to use MIDI velocity to change volume. This is the same
 *   convention that PureData uses. This behavior might change in the
 *   future.
 * @param  {Number} power Power
 * @return {Number}       Decibel
 */
const powtodb = (power) => {
  if (power <= 0) return 0;
  const db = 100 + 10.0 / Math.LN10 * Math.log(power);
  return db < 0 ? 0 : db;
};

/**
 * Converts decibel to power. Note that it is off by 100dB to make it
 *   easy to use MIDI velocity to change volume. This is the same
 *   convention that PureData uses. This behavior might change in the
 *   future.
 * @param  {Number} db Decibel
 * @return {Number}    Power
 */
const dbtopow = (db) => {
  if (db <= 0) return 0;
  if (db > 870) db = 870;
  return Math.exp(Math.LN10 * 0.1 * (db - 100.0));
};

/**
 * Converts RMS(root-mean-square) to decibel.
 * @param  {Number} rms RMS value
 * @return {Number}     Decibel
 */
const rmstodb = (rms) => {
  if (rms <= 0) return 0;
  const db = 100 + 20.0 / Math.LN10 * Math.log(rms);
  return db < 0 ? 0 : db;
};

/**
 * Converts decibel to RMS(root-mean-square).
 * @param  {Number} db  Decibel
 * @return {Number}     RMS value
 */
const dbtorms = (db) => {
  if (db <= 0) return 0;
  if (db > 485) db = 485;
  return Math.exp(Math.LN10 * 0.05 * (db - 100.0));
};

/**
 * Converts linear amplitude to decibel.
 * @param  {Number} lin Linear amplitude
 * @return {Number}     Decibel
 */
const lintodb = (lin) => {
  // if below -100dB, set to -100dB to prevent taking log of zero
  return 20.0 * (lin > 0.00001 ? (Math.log(lin) / Math.LN10) : -5.0);
};

/**
 * Converts decibel to linear amplitude. Useful for dBFS conversion.
 * @param  {Number} db  Decibel
 * @return {Number}     Linear amplitude
 */
const dbtolin = (db) => {
  return Math.pow(10.0, db / 20.0);
};

/**
 * Converts MIDI velocity to linear amplitude.
 * @param  {Number} velocity MIDI velocity
 * @return {Number}     Linear amplitude
 */
const veltoamp = (velocity) => {
  return velocity / 127;
};

export {
  clamp,
  random2f,
  random2,
  mtof,
  ftom,
  powtodb,
  dbtopow,
  rmstodb,
  dbtorms,
  lintodb,
  dbtolin,
  veltoamp,
};
