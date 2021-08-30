//adc.chan(0) => Gain inGain => dac;
adc.chan(0) => Gain inGain => Gain dry => Gain final;
inGain => LPF lpfInput => Gain invert1 => Gain octave1 => LPF lpf1 => final;
invert1 => Gain invert2 => Gain octave2 => LPF lpf2 => final;
final => WvOut w => dac;

/////////////////////

// master volume knob
1 => final.gain;

// preamp gain
5 => inGain.gain;

// "knobs" for mix //
0.3 => dry.gain;
0.3 => octave1.gain;
0. => octave2.gain;

// Write to
w.wavFilename("donnalee.wav");
null @=> w;

/////////////////////

//test freq
// 400 => s.freq;

// filter octave 
400 => lpf1.freq;
200 => lpf2.freq;

// filter the input before inverting
100 => lpfInput.freq;
1 => lpfInput.Q;

// initial q value for octave 1 flip-flop frequency divider
-1 => float q1;
-1 => float q2;

// keeps track of last sample.
float lastLast;
float lastQ1;

// infinite time-loop
while( true )
{
    
    // d flip-flop -- refer to q inverted as d input. Inverts the signal at every new rising edge.
    if (lpfInput.last() > 0 && lastLast < 0)
    {
        q1 * -1 => q1;
    }
    
    // flip flop for second octave vased on first
    if (q1 > 0 && lastQ1 < 0) 
    {
        q2 * -1 => q2;
    }
    
    q1 => lastQ1;
    lpfInput.last() => lastLast;
    
    // invert the signal
    q1 => invert1.gain;
    q2 => invert2.gain;
    
    // increment by one sample
    1::samp => now;
}