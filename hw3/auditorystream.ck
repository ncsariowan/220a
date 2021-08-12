// @title hw3-starter.ck
// @author Chris Chafe (cc@ccrma), Hongchan Choi (hongchan@ccrma), Madeline Huberth (mhuberth@ccrma)
// @desc A starter code for homework 3, Music220a-2021
// @note a demonstration/template for auditory streaming

// -------------------------------------------------------------
// This code creates three FM instruments that, when played
// at a slow rate, create one auditory stream. When the tempo is sped up, however,
// different rhythms and melodic groupings pop out of the texture, due to your mind's 
// grouping of the sounds. Outputs to dac and .wav file.

// -------------------------------------------------------------
// array to hold midi pitches (key numbers) 
[68, 71, 74, 77, 69, 73, 76, 81, 76, 72, 69, 67, 
66, 69, 74, 78, 67, 71, 74, 79, 74, 71, 67, 66,
65, 68, 71, 74, 66, 70, 73, 78, 64, 70, 73, 78,
62, 66, 71, 74, 64, 67, 71, 76, 65, 68, 71, 74,
66, 71, 74, 78, 83, 83, 66, 70, 73, 78, 82, 82] @=> int keyn[];
// these will be converted into the carrier frequencies

// how many pitches are in the array
keyn.cap() => int nP;

// -------------------------------------------------------------
// against a cycle of a different length which we'll use to vary 
// instrument parameters
4 => int nI;

// arrays to hold modulation frequency, timing of modulation envelope, 
// and timing/gain of carrier ADSRs
// really, anything that we want to use to break the repeating pitches
// into multiple streams

// FMFS is a custom class, "FM From Scratch"
// instantiate nI instances of the class
// make arrays for carrier amplitude & carrier amplitude envelope breakpoints, 
// and modulation frequency ratio & index & modulation envelope breakpoints
// ADSR stands for "Attack-Decay-Sustain-Release"
FMFS fm[nI];
float cAmp[nI];
float cADSR[nI][0]; // 2d array, second dimension will hold an array of float values for ADSR
float pRatio[nI];
float mRatio[nI];
float mIndex[nI];
float mADSR[nI][0];

[0.4, 0.2, 1.0, 0.5] @=> float cADSR1[];
[0.2, 0.8, 0.5, 0.2] @=> float cADSR2[];
[0.01, 0.3, 0.5, 0.3] @=> float cADSR3[];
[0.01, 0.4, 0.3, 0.1] @=> float cADSR4[];

JCRev @ rs[];
JCRev r1; JCRev r2; JCRev r3; JCRev r4; 
[r1, r2, r3, r4] @=> rs;

[0.5,1.0,2.0, 1.0] @=> pRatio;
[2.0, 4.0, 0.5, 2.0] @=> mRatio;
[5.0, 3.0, 1.0, 5.0] @=> mIndex;

Pan2 @ pans[];
Pan2 lp; Pan2 l2p; Pan2 cp; Pan2 r2p; Pan2 rp;
-1.0 => lp.pan; -0.5 => l2p.pan; 0 => cp.pan; 0.5 => r2p.pan; 1.0 => rp.pan;



if (nI == 3) {
   [lp, rp, cp] @=> pans;
   [cADSR1, cADSR3, cADSR4] @=> cADSR;
} else {
    [lp, r2p, lp, rp] @=> pans;
    [cADSR1, cADSR2, cADSR3, cADSR4] @=> cADSR;
}


for (0 => int i; i < nI; i++) 
{
    <<<"instrument",i,"has modulation frequency ratio of", mRatio[i]>>>;
    [.01,.4,1.0,.1] @=> mADSR[i];
    0.10 => rs[i].mix;
    fm[i].out => rs[i] => pans[i] => dac; 
}

[160::ms, 100::ms, 120::ms, 80::ms] @=> dur duration[];

// -------------------------------------------------------------
// global parameters

// set a common note duration
//100::ms => dur duration;
// starting inter-onset interval (inverse of tempo)
800::ms => dur ioi;
// accelerate to this smallest IOI (inter-onset-interval - the length of silence between notes!)                
60::ms => dur minIoi;
// variable for which pitch is next
0 => int p;
// variable for which instrument is next                         
0 => int i;


// loop for 20 seconds
now => time beg;
beg + 60::second => time end;
dac => WvOut2 w => blackhole;
//dac.chan(0) => w.chan(1);
w.wavFilename("media/paganini" + nI + ".wav");
while (now < end) {
    // print pitch index, instrument index
    <<< "P =", p, "\tI =", i >>>;
    Std.mtof(keyn[p]) => float cFreq;
    // assign pitch
    spork ~fm[i].playFM(duration[i], cFreq, pRatio[i], cADSR[i], mRatio[i], mIndex[i], mADSR[i]);
    // increment note and instrument
    p++;
    i++;
    // cycle pitch through full array
    nP %=> p;
    // cycle instrument through full array
    nI %=> i;
    
    // advance time by interval and calculate the next time interval
    ioi => now;
    // accelerate
    if (ioi > minIoi) 
      ioi * 0.98 => ioi;
      else
    // can't go faster than minIoi 
        minIoi => ioi;
    
}

// -------------------------------------------------------------
// @class FMFS
// fm implementation from scratch with envelopes
// @author 2015 Madeline Huberth, 2021 version by CC
class FMFS
{ // two typical uses of the ADSR envelope unit generator...
    Step unity => ADSR envM => blackhole; //...as a separate signal
    SinOsc mod => blackhole;
    SinOsc car => ADSR envC => Gain out;  //...as an inline modifier of a signal
    car.gain(0.2);
    float freq, index, ratio; // the parameters for our FM patch

    fun void fm() // this patch is where the work is
    {
      while (true)
      {
        envM.last() * index => float currentIndex; // time-varying index
        mod.gain( freq * currentIndex );    // modulator gain (index depends on frequency)
        mod.freq( freq * ratio );           // modulator frequency (a ratio of frequency) 
        car.freq( freq + mod.last() );      // frequency + modulator signal = FM 
        1::samp => now;
      }
    }
    spork ~fm(); // run the FM patch

    // function to play a note on our FM patch
    fun void playFM( dur length, float pitch, float pRatio, float cADSR[], float mRatio, float mGain, float mADSR[] ) 
    {
        // set patch values
        pRatio * pitch => freq;
        mRatio => ratio;
        mGain => index;
       // run the envelopes
        spork ~ playEnv( envC, length, cADSR );
        spork ~ playEnv( envM, length, mADSR );
        length => now; // wait until the note is done
    }

    fun void playEnv( ADSR env, dur length, float adsrValues[] )
    {
        // set values for ADSR envelope depending on length
        length * adsrValues[0] => dur A;
        length * adsrValues[1] => dur D;
        adsrValues[2] => float S;
        length * adsrValues[3] => dur R;
        
        // set up ADSR envelope for this note
        env.set( A, D, S, R );
        // start envelope (attack is first segment)
        env.keyOn();
        // wait through A+D+S, before R
        length-env.releaseTime() => now;
        // trigger release segment
        env.keyOff();
        // wait for release to finish
        env.releaseTime() => now;
    }
    
} 
// END OF CLASS: FM
