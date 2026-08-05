# Discogs credit review report

Status: generated review queue, not canonical data.

## Summary

- Comparison albums: 760
- Credit/studio candidates: 433
- Review items: 234
- Gaps: 93
- Total unresolved: 327

## Review reasons

- ambiguous-discogs-master-search-result: 201
- discogs-master-fetch-failed: 5
- source-cache-without-usable-credits: 28

## Gap reasons

- no-exact-discogs-master-search-result: 93

## How to resolve

The live static app includes a **Discogs credit review** helper above the comparison browser. It loads this generated report, lets you filter unresolved cases, shows the available Discogs master candidates, and creates copyable JSON rows for the review files. For `inspect-release-or-mark-gap` cases, it now also shows source diagnostics: selected source IDs, cache paths, payload kind, available credit/company/track counts, and a suggested next action. The helper does not write files or mutate canonical data; paste approved snippets into the files below and regenerate.

- For `approve-master-override`, add an approved row to `data/review/discogs-credit-master-overrides.json`.
- For `add-search-alias`, add an approved row to `data/review/discogs-credit-search-aliases.json`.
- For stale Discogs IDs or empty credit caches, inspect the candidate source and either approve an alternate master, reject it, or leave the album as a documented gap.
- Re-run `npm run import:discogs-credits`, then `npm run build:discogs-credit-review`.

## Top unresolved items by latest Rolling Stone rank

1. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

2. The Beatles — *The White Album* (1968)
   - latest rank #10
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

3. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

4. The Notorious B.I.G. — *Ready to Die* (1994)
   - latest rank #22
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263614: The Notorious B.I.G.* - Ready To Die (1994) — https://api.discogs.com/masters/1263614
    - 1263642: The Notorious B.I.G.* - Ready To Die — https://api.discogs.com/masters/1263642
    - 1263613: The Notorious B.I.G.* - Ready To Die (1994) — https://api.discogs.com/masters/1263613
    - 1263672: The Notorious B.I.G.* - Ready To Die (1994) — https://api.discogs.com/masters/1263672

5. The Beatles — *Sgt. Pepper's Lonely Hearts Club Band* (1967)
   - latest rank #24
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264303: The Beatles - Sgt. Pepper's Lonely Hearts Club Band (1967) — https://api.discogs.com/masters/1264303
    - 1264297: The Beatles - Sgt. Pepper's Lonely Hearts Club Band — https://api.discogs.com/masters/1264297
    - 1264296: The Beatles - Sgt. Pepper's Lonely Hearts Club Band (1967) — https://api.discogs.com/masters/1264296

6. The Beatles — *White Album* (1968)
   - latest rank #29
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

7. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

8. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

9. Paul Simon — *Graceland* (1986)
   - latest rank #46
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 152341: Paul Simon - Graceland  (1986) — https://api.discogs.com/masters/152341
    - 55658: Paul Simon - Graceland (1986) — https://api.discogs.com/masters/55658

10. Bob Marley and the Wailers — *Exodus* (1977)
   - latest rank #48
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 168594: Bob Marley And The Wailers* - Exodus (1977) — https://api.discogs.com/masters/168594
    - 65858: Bob Marley & The Wailers - Exodus (1977) — https://api.discogs.com/masters/65858
    - 257657: Bob Marley & The Wailers - War/No More Trouble / Exodus (1978) — https://api.discogs.com/masters/257657

11. Bob Marley and the Wailers — *Legend* (1984)
   - latest rank #48
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

12. Led Zeppelin — *Led Zeppelin IV* (1971)
   - latest rank #58
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

13. Creedence Clearwater Revival — *Chronicle, Vol. 1* (1976)
   - latest rank #59
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

14. Captain Beefheart and his Magic Band — *Trout Mask Replica* (1969)
   - latest rank #60
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

15. OutKast — *Stankonia* (2000)
   - latest rank #64
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 616158: OutKast - Stankonia (2000) — https://api.discogs.com/masters/616158
    - 1236820: OutKast - Stankonia (2000) — https://api.discogs.com/masters/1236820
    - 26124: OutKast - Stankonia (2000) — https://api.discogs.com/masters/26124

16. Phil Spector — *Back To Mono* (1991)
   - latest rank #65
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

17. Phil Spector — *Back to Mono (1958-1969)* (1991)
   - latest rank #65
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264847: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/1264847
    - 253925: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/253925

18. Alanis Morissette — *Jagged Little Pill* (1995)
   - latest rank #69
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1300279: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/1300279
    - 31513: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/31513

19. N.W.A — *Straight Outta Compton* (1988)
   - latest rank #70
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263648: N.W.A. - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263648
    - 26117: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/26117
    - 1263646: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263646

20. Curtis Mayfield — *Super Fly* (1972)
   - latest rank #76
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 895376: Curtis Mayfield - Super Fly (1972) — https://api.discogs.com/masters/895376

21. Elvis Presley — *The Sun Sessions* (1976)
   - latest rank #78
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 198268: Elvis Presley - The Sun Sessions (1976) — https://api.discogs.com/masters/198268

22. Frank Ocean — *Blond* (2016)
   - latest rank #79
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

23. The Sex Pistols — *Never Mind the Bollocks Here's the Sex Pistols* (1977)
   - latest rank #80
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

24. The Clash — *The Clash* (1979)
   - latest rank #81
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 19588: The Clash - The Clash — https://api.discogs.com/masters/19588
    - 553738: The Clash - The Clash (1979) — https://api.discogs.com/masters/553738

25. AC/DC — *Back in Black* (1980)
   - latest rank #84
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 347109: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/347109
    - 8471: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/8471
    - 324463: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/324463

26. John Lennon — *Plastic Ono Band* (1970)
   - latest rank #85
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3404152: John Lennon & Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/3404152
    - 72864: John Lennon / Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/72864

27. The Doors — *The Doors* (1967)
   - latest rank #86
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1339472: The Doors - The Doors — https://api.discogs.com/masters/1339472
    - 406648: The Doors - The Doors (1968) — https://api.discogs.com/masters/406648

28. Erykah Badu — *Baduizm* (1997)
   - latest rank #89
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 482209: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/482209
    - 43655: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/43655

29. Missy "Misdemeanor" Elliott — *Supa Dupa Fly* (1997)
   - latest rank #93
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

30. Metallica — *Master of Puppets* (1986)
   - latest rank #97
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 308202: Metallica - Master Of Puppets (1986) — https://api.discogs.com/masters/308202
    - 6495: Metallica - Master Of Puppets (1986) — https://api.discogs.com/masters/6495

31. Taylor Swift — *Red* (2012)
   - latest rank #99
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 488435: Taylor Swift - Red (2012) — https://api.discogs.com/masters/488435
    - 572389: Taylor Swift - Red (2012) — https://api.discogs.com/masters/572389

32. Led Zeppelin — *Led Zeppelin* (1969)
   - latest rank #101
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264286: Led Zeppelin - Led Zeppelin (1970) — https://api.discogs.com/masters/1264286
    - 1264336: Led Zeppelin - Led Zeppelin (1969) — https://api.discogs.com/masters/1264336
    - 1264300: Led Zeppelin - Led Zeppelin (1969) — https://api.discogs.com/masters/1264300
    - 1264276: Led Zeppelin - Led Zeppelin — https://api.discogs.com/masters/1264276

33. The Clash — *The Clash* (1977)
   - latest rank #102
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 19588: The Clash - The Clash — https://api.discogs.com/masters/19588
    - 24371: The Clash - The Clash (1977) — https://api.discogs.com/masters/24371

34. De La Soul — *Three Feet High And Rising* (1989)
   - latest rank #103
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

35. John Coltrane — *Giant Steps* (1959)
   - latest rank #103
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3166659: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/3166659
    - 32236: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/32236
    - 1269265: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/1269265

36. The Rolling Stones — *Sticky Fingers* (1971)
   - latest rank #104
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 23828: The Rolling Stones - Sticky Fingers  (1971) — https://api.discogs.com/masters/23828
    - 2048545: The Rolling Stones - Exile On Main Street / Sticky Fingers  — https://api.discogs.com/masters/2048545

37. Hole — *Live Through This* (1994)
   - latest rank #106
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 43730: Hole (2) - Live Through This (1994) — https://api.discogs.com/masters/43730
    - 1714738: Hole (2) - Selections From Live Through This (1994) — https://api.discogs.com/masters/1714738

38. Television — *Marquee Moon* (1977)
   - latest rank #107
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 6202: Television - Marquee Moon (1977) — https://api.discogs.com/masters/6202
    - 30714: Television - Marquee Moon (1977) — https://api.discogs.com/masters/30714

39. Fiona Apple — *When the Pawn …* (1999)
   - latest rank #108
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

40. Joni Mitchell — *Court and Spark* (1974)
   - latest rank #110
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 47758: Joni Mitchell - Court And Spark (1974) — https://api.discogs.com/masters/47758
    - 344604: Joni Mitchell - Raised On Robbery / Court And Spark (1973) — https://api.discogs.com/masters/344604

41. Janet Jackson — *Control* (1986)
   - latest rank #111
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 79648: Janet Jackson - Control (1986) — https://api.discogs.com/masters/79648
    - 79655: Janet Jackson - Control (1986) — https://api.discogs.com/masters/79655
    - 1002617: Janet Jackson = ジャネット・ジャクソン* - Control = コントロール (1986) — https://api.discogs.com/masters/1002617
    - 300916: Janet Jackson - More Control (1987) — https://api.discogs.com/masters/300916

42. Elton John — *Goodbye Yellow Brick Road* (1973)
   - latest rank #112
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 444766: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/444766
    - 30577: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/30577
    - 85563: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/85563

43. The Smiths — *The Queen Is Dead* (1986)
   - latest rank #113
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1819803: The Smiths - The Queen Is Dead — https://api.discogs.com/masters/1819803
    - 20137: The Smiths - The Queen Is Dead (1986) — https://api.discogs.com/masters/20137

44. Kendrick Lamar — *good kid, m.A.A.d city* (2012)
   - latest rank #115
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

45. The Rolling Stones — *Out Of Our Heads* (1965)
   - latest rank #116
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 194321: The Rolling Stones - Out Of Our Heads (1965) — https://api.discogs.com/masters/194321
    - 54131: The Rolling Stones - Out Of Our Heads (1965) — https://api.discogs.com/masters/54131

46. The Eagles — *Hotel California* (1976)
   - latest rank #118
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

47. Sly and the Family Stone — *Stand!* (1969)
   - latest rank #119
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3216205: Sly & The Family Stone - Stand! (1969) — https://api.discogs.com/masters/3216205
    - 1437243: Sly & The Family Stone - Stand!  (1969) — https://api.discogs.com/masters/1437243
    - 78501: Sly And The Family Stone* - Stand! (1969) — https://api.discogs.com/masters/78501
    - 116865: Sly & The Family Stone - Stand! (1969) — https://api.discogs.com/masters/116865

48. Elvis Costello — *This Year's Model* (1978)
   - latest rank #121
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 505876: Elvis Costello - This Year's Model (1978) — https://api.discogs.com/masters/505876
    - 455505: Elvis Costello - This Year's Model (1978) — https://api.discogs.com/masters/455505
    - 42843: Elvis Costello - This Year's Model (1978) — https://api.discogs.com/masters/42843
    - 511137: Elvis Costello - This Year's Model (1978) — https://api.discogs.com/masters/511137
    - 39499: Elvis Costello & The Attractions - This Year's Model (1978) — https://api.discogs.com/masters/39499

49. Jimmy Cliff — *The Harder They Come* (1972)
   - latest rank #122
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

50. Nine Inch Nails — *The Downward Spiral* (1994)
   - latest rank #122
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 563608: Nine Inch Nails - The Downward Spiral — https://api.discogs.com/masters/563608
    - 3719: Nine Inch Nails - The Downward Spiral (1994) — https://api.discogs.com/masters/3719
