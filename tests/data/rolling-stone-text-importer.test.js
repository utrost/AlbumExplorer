import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRollingStoneText } from '../../src/data/rolling-stone-text-importer.js';

test('parses pasted Rolling Stone text rows with rank, title, label, and year', () => {
  const rows = parseRollingStoneText(`500
OutKast, ‘Aquemini’

LaFace, 1998

Description.
499
B.B. King, ‘Live in Cook County Jail’

ABC, 1971

Description.
`);

  assert.deepEqual(rows, [
    { rank: 500, artist: 'OutKast', album: 'Aquemini', label: 'LaFace', year: 1998 },
    { rank: 499, artist: 'B.B. King', album: 'Live in Cook County Jail', label: 'ABC', year: 1971 }
  ]);
});

test('parses artist names with commas and malformed missing closing curly quote', () => {
  const rows = parseRollingStoneText(`486
Earth, Wind and Fire, ‘That’s the Way of the World’

Columbia, 1975

Description.
480
Raekwon, ‘Only Built 4 Cuban Linx

Loud, 1995

Description.
`);

  assert.equal(rows[0].artist, 'Earth, Wind and Fire');
  assert.equal(rows[0].album, 'That’s the Way of the World');
  assert.equal(rows[1].artist, 'Raekwon');
  assert.equal(rows[1].album, 'Only Built 4 Cuban Linx');
});

test('parses rank glued to the preceding display-title line', () => {
  const rows = parseRollingStoneText(`Marvin Gaye, Here, My Dear456
Marvin Gaye, ‘Here, My Dear’

Motown, 1978

Description.
Los Lobos, How Will the Wolf Survive455
Los Lobos, ‘How Will the Wolf Survive?’

Slash/Warner Bros., 1984
`);

  assert.deepEqual(rows, [
    { rank: 456, artist: 'Marvin Gaye', album: 'Here, My Dear', label: 'Motown', year: 1978 },
    { rank: 455, artist: 'Los Lobos', album: 'How Will the Wolf Survive?', label: 'Slash/Warner Bros.', year: 1984 }
  ]);
});

test('uses descending expected rank to disambiguate glued digits', () => {
  const rows = parseRollingStoneText(`138
Madonna, ‘The Immaculate Collection’
Sire, 1990
500 albums adele 21137
Adele, ’21’
Columbia, 2011
136
Funkadelic, ‘Maggot Brain’
Westbound, 1971
60
Van Morrison, ‘Astral Weeks’
Warner Bros., 1968
500 albums led zeppelin iv four 58
Led Zeppelin, ‘Led Zeppelin IV’
Atlantic, 1971
57
The Band, ‘The Band’
Capitol, 1969
`);

  assert.deepEqual(rows.map((row) => row.rank), [138, 137, 136, 60, 58, 57]);
  assert.equal(rows[1].artist, 'Adele');
  assert.equal(rows[1].album, '21');
  assert.equal(rows[4].artist, 'Led Zeppelin');
  assert.equal(rows[4].album, 'Led Zeppelin IV');
});

test('parses label and year separated by a period typo', () => {
  const rows = parseRollingStoneText(`437
Gorillaz, ‘Demon Days’
EMI. 2005
Powered byApple Music
`);

  assert.deepEqual(rows, [
    { rank: 437, artist: 'Gorillaz', album: 'Demon Days', label: 'EMI', year: 2005 }
  ]);
});

test('keeps label and year null when the pasted row has no label line', () => {
  const rows = parseRollingStoneText(`458
Elton John, ‘Tumbleweed Connection’

John has always had a jones for the myth of the American West.
457
My Morning Jacket, ‘Z’

RCA, 2005
`);

  assert.equal(rows[0].rank, 458);
  assert.equal(rows[0].label, null);
  assert.equal(rows[0].year, null);
  assert.equal(rows[1].label, 'RCA');
  assert.equal(rows[1].year, 2005);
});
