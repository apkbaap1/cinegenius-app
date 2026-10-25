// SCORE · "Kothi, Mosali". World / modal folk, drawing on South Indian folk and light-classical
// colour (a tonic drone, a bansuri-like flute, plucked strings, hand drums). No traditional melody is
// quoted: every motif below is written for this film.
//
// Brief as numbers: 80 s (retimed to the voice-over), 90 bpm 4/4 (one beat = 20 frames, one bar = 80 frames), 30 bars.
// It sits UNDER the user's own Telugu voice-over, so the lead is sparse and leaves holes for words.
// Picture beats -> bars (bar n starts at frame 80 n):
//   0-3   title card, the river draws itself       intro: drone + harp alone
//   3-11  friendship, jamun fruit thrown daily      verse: D mixolydian (the Harikambhoji colour), the motif
//   11-15 the ride out across the river             build: the motif sequenced up, drums thicken
//   15-19 the confession mid-river (the turn)       breakdown: D phrygian (the Todi colour), drone + heartbeat
//   19-21 "my heart is up in the tree!"             bridge: back to mixolydian, the motif fragmented, a question
//   21-24 the ride back and the leap                drop: the motif augmented; the climax A5 on bar 22 (the leap)
//   24-28 the moral, the jamun alone on the river   outro: the motif's last word on the tonic over the drone
// Tension curve: .25 .45 .6 .8 .55 1.0 .2
import type { Material } from "./music/compose";

export const score = (): Material => ({
  style: "world", title: "Kothi, Mosali", seed: 4127, mood: "mischief",
  bpm: 90, key: "D", mode: "mixolydian", meter: "4/4",
  moodControls: { energy: 0.45, warmth: 0.6, brightness: 0.5, tension: 0.35, space: 0.55 },
  levels: { counter: 4 },
  swing: 0.52, dyn: [0.56, 0.62], tail: 3.4,
  chords: {
    D5: { voicing: "[D3 A3 D4]", bass: "D2:4" },
    C5: { voicing: "[C3 G3 C4]", bass: "C2:3 C2:1" },
    G: { voicing: "[G2 D3 B3]", bass: "G1:3 G1:1" },
    Asus: { voicing: "[A2 E3 D4]", bass: "A1:4" },
    Dph: { voicing: "[D3 A3 D4]", bass: "D2:4" },
    Eb: { voicing: "[Eb3 Bb3 Eb4]", bass: "Eb2:4" },
  },
  motifs: {
    // the motif: an upbeat skip and a turn, the long note on beat 4; asks (ends on A), then answers home
    ask: "r:0.5 A4:0.5 B4:0.25 A4:0.25 F#4:0.5 A4:1 D5:1 | C5:0.5 B4:0.5 A4:1.5 r:1.5",
    answer: "r:0.5 A4:0.5 B4:0.25 A4:0.25 F#4:0.5 G4:1 E4:1 | F#4:0.5 E4:0.5 D4:2 r:1",
    // the ask again, ornamented, reaching higher (E5) before falling to the fifth
    askOrn: "r:0.5 A4:0.5 B4:0.25 C5:0.25 B4:0.25 A4:0.25 F#4:0.5 A4:0.5 D5:1 | E5:0.5 C5:0.5 D5:0.5 B4:0.5 A4:2",
    // sequenced a step up for the ride out
    askUp: "r:0.5 B4:0.5 C5:0.25 B4:0.25 A4:0.5 B4:1 E5:1 | D5:0.5 E5:0.5 C5:1.5 r:1.5",
    rideOn: "r:0.5 A4:0.5 B4:0.25 C5:0.25 D5:0.5 E5:1 F#5:1 | E5:0.5 D5:0.5 C5:1 A4:1 r:1",
    // the confession: low, slow, the flat second (Eb) leaning on the tonic
    dark: "A4:1.5 Bb4:0.5 A4:2 | r:1 G4:0.5 F4:0.5 Eb4:1 D4:1 | r:4 | D4:2 Eb4:1 D4:1",
    // the idea: the motif's head, broken off, then a rising question
    idea: "r:0.5 A4:0.5 B4:0.25 A4:0.25 F#4:0.5 r:2 | r:0.5 A4:0.5 B4:0.25 C5:0.25 D5:0.5 E5:2",
    // the leap: the motif augmented, peaking on A5
    leap: "A4:0.5 D5:0.5 E5:1 F#5:2 | A5:1.5 G5:0.5 F#5:1 D5:1 | E5:1 F#5:0.5 E5:0.5 D5:2",
    last: "r:2 A4:0.5 B4:0.5 D5:1 | D5:4 | r:4 | r:4",
    // harp answers in the lead's rests
    harpIntro: "D4:0.5 A4:0.5 D5:0.5 F#5:0.5 A5:2 | r:1 G5:0.5 F#5:0.5 E5:1 D5:1 | A4:2 r:2",
    harpAns: "r:4 | r:2.5 A5:0.5 F#5:0.5 D5:0.5",
    harpTremor: "D4:0.25 Eb4:0.25 D4:0.25 Eb4:0.25 r:3 | r:4",
    harpLast: "r:4 | r:2 D5:0.5 A4:0.5 F#4:0.5 D4:0.5 | A3:4 | r:4",
  },
  grooves: {
    main: { family: "hand", density: 0.4, variation: 0.35 },
    half: { family: "pulse", density: 0.3, variation: 0.2 },
    build: { family: "hand", density: 0.6, variation: 0.5 },
  },
  sections: [
    { kind: "intro", bars: 3, harmony: ["D5", "~", "~"], counter: ["harpIntro"], groove: null, chordVel: 0.7, energy: 0.35 },
    { kind: "verse", bars: 8, harmony: ["D5", "~", "C5", "D5", "D5", "G", "C5", "D5"], lead: ["ask", "answer", "askOrn", "answer"], counter: ["harpAns", "harpAns", "harpAns", "harpAns"], groove: "main", energy: 0.45, stretch: true },
    { kind: "build", bars: 4, harmony: ["D5", "C5", "G", "Asus"], lead: ["askUp", "rideOn"], groove: "build", energy: 0.6 },
    { kind: "breakdown", bars: 5, key: "D", mode: "phrygian", harmony: ["Dph", "~", "Eb", "Dph", "Dph"], lead: ["dark"], counter: ["harpTremor", "harpTremor"], groove: "half", energy: 0.45, chordVel: 0.8 },
    { kind: "bridge", bars: 2, harmony: ["C5", "Asus"], lead: ["idea"], groove: "main", energy: 0.55 },
    { kind: "drop", bars: 4, harmony: ["D5", "D5", "G", "D5"], lead: ["r:4", "leap"], groove: "build", energy: 0.85 },
    { kind: "outro", bars: 4, harmony: ["D5", "~", "~", "~"], lead: ["last"], counter: ["harpLast"], groove: null, energy: 0.35, chordVel: 0.75 },
  ],
});
