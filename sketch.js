// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Basic Pitch Detection
=== */

let audioContext;
let mic;
let pitch;
let hummingPitches = [];
let noteIndex = 0; // the MIDI note
let hummingBtn;
let modelStatus = false;
let recordInterval;
let prevNote = 0;

//Melody
//D5: 74; E5:76; G5: 79, F#5: 78.
//Each line is a bar (2 beats for Baby Shark)
//int melody[] = {74, 0, 0, 0, 76, 0, 0, 0,79, 0, 79, 0, 79, 79, 79,0, 79, 79, 0, 74, 0, 76, 0,79, 0, 79, 0, 79, 79, 79,0, 79, 79, 0, 74, 0, 76, 0,79, 0, 79, 0, 79, 79, 79,0, 79, 79, 0, 79, 0, 79, 0,78, 0, 0, 0, 0, 0, 0, 0};

//int noteIndex = 1;
//int noteNum = 64;
//noteIndex = abs(encoderRead) % noteNum; //calculate note index

//serial part
var serial; // variable to hold an instance of the serialport library
var portName = '/dev/tty.usbmodem14101';
var options = { baudrate: 9600}; // change the data rate to whatever you wish
let inData; //incoming serial data


function setup() {
   noCanvas();
  // createCanvas(710, 200);
  audioContext = getAudioContext();
  mic = new p5.AudioIn();
  mic.start(startPitch);

  //serial communication part
  serial = new p5.SerialPort(); // make a new instance of the serialport library
  serial.on('list', printList); // set a callback function for the serialport list event
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);        // callback for the port opening
  serial.on('data', serialEvent);     // callback for when new data arrives
  serial.on('error', serialError);    // callback for errors
  serial.on('close', portClose);      // callback for the port closing

  serial.list();                      // list the serial ports
  serial.open(portName, options);              // open a serial port
}


// get the list of ports:
function printList(portList) {
 // portList is an array of serial port names
 for (var i = 0; i < portList.length; i++) {
 // Display the list the console:
 console.log(i + " " + portList[i]);
 }
}


function serverConnected() {
  console.log('connected to server.');
}

function portOpen() {
  console.log('the serial port opened.')
}

function serialEvent() {
  inData = Number(serial.read());
  console.log(inData);
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  MIDI.setVolume(0, 127);

  let thisNote = hummingPitches[noteIndex];


  // Handle -1 value!!!!!!!!
  if (thisNote != -1) {
    // if (thisNote != prevNote) {
      if (inData == 4) {
        MIDI.noteOn(0, thisNote, velocity, delay);
      } else if (inData == 14) {
        MIDI.noteOn(1, thisNote, velocity, delay);
      } else if (inData == 24) {
        MIDI.noteOn(2, thisNote, velocity, delay);
      } else if (inData == 34) {
        MIDI.noteOn(3, thisNote, velocity, delay);
      }
    // }
  }

  prevNote = thisNote;

  noteIndex ++;
  if (noteIndex >= hummingPitches.length) {
    noteIndex = 0;
  }
  console.log(noteIndex);
}

function serialError(err) {
  console.log('Something went wrong with the serial port. ' + err);
}

function portClose() {
  console.log('The serial port closed.');
}

// function draw() {
  // background(200);
  //
  // // Get the overall volume (between 0 and 1.0)
  // let vol = mic.getLevel();
  // fill(127);
  // stroke(0);
  //
  // // Draw an ellipse with height based on volume
  // let h = map(vol, 0, 1, height, 0);
  // ellipse(width / 2, h - 25, 50, 50);
  //
  // text("sensor value: " + inData, 30, 30);
// }



window.onload = function () {
	MIDI.loadPlugin({
		soundfontUrl: "lib/MIDIjs/soundfont/",
		instruments: [ "acoustic_grand_piano", "synth_drum", "acoustic_guitar_nylon", "music_box" ],
		callback: function() {
      MIDI.programChange(0, 10); //default channel: music box
      MIDI.programChange(1, 0); //Channel 1: piano
      MIDI.programChange(2, 24); // Channel 2: guitar
      MIDI.programChange(3, 118); // Channel 3: synth_drum
            //
      			// var delay = 0; // play one note every quarter second
      			// var note = 50; // the MIDI note
      			// var velocity = 127; // how hard the note hits
      			// // play the note
      			// MIDI.setVolume(0, 127);
      			// MIDI.noteOn(0, note, velocity, delay);
            // MIDI.noteOn(1, note, velocity, delay+1);
            // MIDI.noteOn(2, note, velocity, delay+2);
            // MIDI.noteOn(3, note, velocity, delay+3);
      			// //MIDI.noteOff(0, note, delay + 0.75);
		}
	});
  hummingBtn = document.getElementById("hummingBtn");
  console.log(hummingBtn);

  hummingBtn.addEventListener("mousedown", function(){
    hummingPitches = [];
    noteIndex = 0;
    if (modelStatus == true) {
      recordInterval = setInterval(getPitch, 66); // around 15 fps
      //setInterval(getPitch, 66); // around 15 fps
    }
    hummingBtn.innerHTML = "Recording";
  });

  hummingBtn.addEventListener("mouseup", function(){
    if (modelStatus == true) {
      clearInterval(recordInterval);
    }
    for (let i = 0; i < hummingPitches.length; i++) {
      let midiNote = frequency2Midi(hummingPitches[i]);
      hummingPitches[i] = midiNote;
    }
    hummingBtn.innerHTML = "Start Humming";
    console.log(hummingPitches);
  });
};



function startPitch() {
  pitch = ml5.pitchDetection('./model/', audioContext , mic.stream, modelLoaded);
}

function modelLoaded() {
  select('#status').html('Model Loaded');
  modelStatus = true;
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

function getPitch() {
  pitch.getPitch(function(err, frequency) {
    if (frequency) {
      select('#result').html(frequency);
      hummingPitches.push(frequency); //Array to hold detected frequency values
    } else {
      select('#result').html('No pitch detected');
      hummingPitches.push(0); //Array to hold detected frequency values
    }
  })
}

function frequency2Midi(frequency){
  let midiNotes = [16, 17, 18, 20, 21, 22, 23, 25, 26, 28, 29, 31,
                   33, 35, 37, 39, 41, 44, 46, 49, 52, 55, 58, 62,
                   65, 69, 73, 78, 82, 87, 93, 98, 104, 110, 117, 124,
                   131, 139, 147, 156, 165, 175, 185, 196, 208, 220, 233, 247,
                   262, 278, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494,
                   523, 554, 587, 622, 659, 699, 740, 784, 831, 880, 932, 988,
                   1047, 1109, 1175, 1245, 1319, 1397, 1475, 1568, 1661, 1760, 1865, 1976,
                   2093, 2218, 2349, 2489, 2637, 2794, 2960, 3136, 3322, 3520, 3729, 3951,
                   4186, 4435, 4699, 4978, 5274, 5588, 5920, 6272, 6645, 7040, 7459, 7902];
  if (frequency == 0) {
    return -1;
  } else {
    for (let i = 0; i < midiNotes.length; i++) {
      if (midiNotes[i] >= frequency) {
        if (i == 0) {
          return -1;
        } else {
          let prevD = frequency - midiNotes[i-1];
          let curD = midiNotes[i] - frequency;
          if (prevD <= curD) {
            return (i-1);
          } else {
            return i;
          }
        }
      }
      if (i >= midiNotes.length-1) {
        return (midiNotes.length-1);
      }
    }
  }
}
