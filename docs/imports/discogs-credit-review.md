# Discogs credit review report

Status: generated review queue, not canonical data.

## Summary

- Comparison albums: 760
- Credit/studio candidates: 428
- Review items: 239
- Gaps: 93
- Total unresolved: 332

## Review reasons

- ambiguous-discogs-master-search-result: 210
- discogs-master-fetch-failed: 5
- source-cache-without-usable-credits: 24

## Gap reasons

- no-exact-discogs-master-search-result: 93

## How to resolve

- For `approve-master-override`, add an approved row to `data/review/discogs-credit-master-overrides.json`.
- For `add-search-alias`, add an approved row to `data/review/discogs-credit-search-aliases.json`.
- For stale Discogs IDs or empty credit caches, inspect the candidate source and either approve an alternate master, reject it, or leave the album as a documented gap.
- Re-run `npm run import:discogs-credits`, then `npm run build:discogs-credit-review`.

## Top unresolved items by latest Rolling Stone rank

1. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3892825: The Beatles - The Beatles — https://api.discogs.com/masters/3892825
    - 456999: The Beatles - The Beatles (1967) — https://api.discogs.com/masters/456999

2. The Beatles — *The White Album* (1968)
   - latest rank #10
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3892825: The Beatles - The Beatles — https://api.discogs.com/masters/3892825
    - 456999: The Beatles - The Beatles (1967) — https://api.discogs.com/masters/456999

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
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3892825: The Beatles - The Beatles — https://api.discogs.com/masters/3892825
    - 456999: The Beatles - The Beatles (1967) — https://api.discogs.com/masters/456999

7. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1288169: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/1288169
    - 778503: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/778503
    - 51331: Amy Winehouse - Back To Black (2007) — https://api.discogs.com/masters/51331
    - 51256: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/51256

8. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 86466: Stevie Wonder - Innervisions (1973) — https://api.discogs.com/masters/86466
    - 1420033: Stevie Wonder - Innervisions (1973) — https://api.discogs.com/masters/1420033

9. Michael Jackson — *Off the Wall* (1979)
   - latest rank #36
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1691133: Michael Jackson - Off The Wall — https://api.discogs.com/masters/1691133
    - 1687681: Michael Jackson - Off The Wall (1979) — https://api.discogs.com/masters/1687681
    - 441594: Michael Jackson - Off The Wall (1979) — https://api.discogs.com/masters/441594
    - 435524: Michael Jackson - Off The Wall (1979) — https://api.discogs.com/masters/435524
    - 1687679: Michael Jackson - Off The Wall (1979) — https://api.discogs.com/masters/1687679

10. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263629: Dr. Dre - The Chronic — https://api.discogs.com/masters/1263629
    - 1263667: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/1263667
    - 1263627: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/1263627
    - 33951: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/33951

11. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

12. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 767754: The Beatles - Please Please Me (1964) — https://api.discogs.com/masters/767754
    - 1306184: The Beatles - Please Please Me — https://api.discogs.com/masters/1306184
    - 45619: The Beatles - Please Please Me (1963) — https://api.discogs.com/masters/45619
    - 45362: The Beatles - Please Please Me (1963) — https://api.discogs.com/masters/45362

13. Prince — *Sign O' the Times* (1987)
   - latest rank #45
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 52776: Prince - Sign "O" The Times (1987) — https://api.discogs.com/masters/52776
    - 52497: Prince - Sign "O" The Times (1987) — https://api.discogs.com/masters/52497
    - 268038: Prince - Sign "O" The Times (1988) — https://api.discogs.com/masters/268038
    - 1341713: Prince - When Doves Cry - It's A Sign O' The Times (1988) — https://api.discogs.com/masters/1341713

14. Paul Simon — *Graceland* (1986)
   - latest rank #46
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 152341: Paul Simon - Graceland  (1986) — https://api.discogs.com/masters/152341
    - 55658: Paul Simon - Graceland (1986) — https://api.discogs.com/masters/55658

15. Bob Marley and the Wailers — *Exodus* (1977)
   - latest rank #48
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 168594: Bob Marley And The Wailers* - Exodus (1977) — https://api.discogs.com/masters/168594
    - 65858: Bob Marley & The Wailers - Exodus (1977) — https://api.discogs.com/masters/65858
    - 257657: Bob Marley & The Wailers - War/No More Trouble / Exodus (1978) — https://api.discogs.com/masters/257657

16. Bob Marley and the Wailers — *Legend* (1984)
   - latest rank #48
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

17. Led Zeppelin — *Led Zeppelin IV* (1971)
   - latest rank #58
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

18. Creedence Clearwater Revival — *Chronicle, Vol. 1* (1976)
   - latest rank #59
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

19. Captain Beefheart and his Magic Band — *Trout Mask Replica* (1969)
   - latest rank #60
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

20. OutKast — *Stankonia* (2000)
   - latest rank #64
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 616158: OutKast - Stankonia (2000) — https://api.discogs.com/masters/616158
    - 1236820: OutKast - Stankonia (2000) — https://api.discogs.com/masters/1236820
    - 26124: OutKast - Stankonia (2000) — https://api.discogs.com/masters/26124

21. Phil Spector — *Back To Mono* (1991)
   - latest rank #65
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

22. Phil Spector — *Back to Mono (1958-1969)* (1991)
   - latest rank #65
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264847: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/1264847
    - 253925: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/253925

23. Alanis Morissette — *Jagged Little Pill* (1995)
   - latest rank #69
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1300279: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/1300279
    - 31513: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/31513

24. N.W.A — *Straight Outta Compton* (1988)
   - latest rank #70
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263648: N.W.A. - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263648
    - 26117: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/26117
    - 1263646: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263646

25. Curtis Mayfield — *Super Fly* (1972)
   - latest rank #76
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 895376: Curtis Mayfield - Super Fly (1972) — https://api.discogs.com/masters/895376

26. Elvis Presley — *The Sun Sessions* (1976)
   - latest rank #78
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 198268: Elvis Presley - The Sun Sessions (1976) — https://api.discogs.com/masters/198268

27. Frank Ocean — *Blond* (2016)
   - latest rank #79
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

28. The Sex Pistols — *Never Mind the Bollocks Here's the Sex Pistols* (1977)
   - latest rank #80
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

29. The Clash — *The Clash* (1979)
   - latest rank #81
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 19588: The Clash - The Clash — https://api.discogs.com/masters/19588
    - 553738: The Clash - The Clash (1979) — https://api.discogs.com/masters/553738

30. AC/DC — *Back in Black* (1980)
   - latest rank #84
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 347109: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/347109
    - 8471: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/8471
    - 324463: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/324463

31. John Lennon — *Plastic Ono Band* (1970)
   - latest rank #85
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3404152: John Lennon & Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/3404152
    - 72864: John Lennon / Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/72864

32. The Doors — *The Doors* (1967)
   - latest rank #86
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1339472: The Doors - The Doors — https://api.discogs.com/masters/1339472
    - 406648: The Doors - The Doors (1968) — https://api.discogs.com/masters/406648

33. Erykah Badu — *Baduizm* (1997)
   - latest rank #89
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 482209: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/482209
    - 43655: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/43655

34. Missy "Misdemeanor" Elliott — *Supa Dupa Fly* (1997)
   - latest rank #93
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

35. Metallica — *Master of Puppets* (1986)
   - latest rank #97
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 308202: Metallica - Master Of Puppets (1986) — https://api.discogs.com/masters/308202
    - 6495: Metallica - Master Of Puppets (1986) — https://api.discogs.com/masters/6495

36. Taylor Swift — *Red* (2012)
   - latest rank #99
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 488435: Taylor Swift - Red (2012) — https://api.discogs.com/masters/488435
    - 572389: Taylor Swift - Red (2012) — https://api.discogs.com/masters/572389

37. Led Zeppelin — *Led Zeppelin* (1969)
   - latest rank #101
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264286: Led Zeppelin - Led Zeppelin (1970) — https://api.discogs.com/masters/1264286
    - 1264336: Led Zeppelin - Led Zeppelin (1969) — https://api.discogs.com/masters/1264336
    - 1264300: Led Zeppelin - Led Zeppelin (1969) — https://api.discogs.com/masters/1264300
    - 1264276: Led Zeppelin - Led Zeppelin — https://api.discogs.com/masters/1264276

38. The Clash — *The Clash* (1977)
   - latest rank #102
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 19588: The Clash - The Clash — https://api.discogs.com/masters/19588
    - 24371: The Clash - The Clash (1977) — https://api.discogs.com/masters/24371

39. De La Soul — *Three Feet High And Rising* (1989)
   - latest rank #103
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

40. John Coltrane — *Giant Steps* (1959)
   - latest rank #103
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3166659: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/3166659
    - 32236: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/32236
    - 1269265: John Coltrane - Giant Steps (1960) — https://api.discogs.com/masters/1269265

41. The Rolling Stones — *Sticky Fingers* (1971)
   - latest rank #104
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 23828: The Rolling Stones - Sticky Fingers  (1971) — https://api.discogs.com/masters/23828
    - 2048545: The Rolling Stones - Exile On Main Street / Sticky Fingers  — https://api.discogs.com/masters/2048545

42. Hole — *Live Through This* (1994)
   - latest rank #106
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 43730: Hole (2) - Live Through This (1994) — https://api.discogs.com/masters/43730
    - 1714738: Hole (2) - Selections From Live Through This (1994) — https://api.discogs.com/masters/1714738

43. Television — *Marquee Moon* (1977)
   - latest rank #107
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 6202: Television - Marquee Moon (1977) — https://api.discogs.com/masters/6202
    - 30714: Television - Marquee Moon (1977) — https://api.discogs.com/masters/30714

44. Fiona Apple — *When the Pawn …* (1999)
   - latest rank #108
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

45. Joni Mitchell — *Court and Spark* (1974)
   - latest rank #110
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 47758: Joni Mitchell - Court And Spark (1974) — https://api.discogs.com/masters/47758
    - 344604: Joni Mitchell - Raised On Robbery / Court And Spark (1973) — https://api.discogs.com/masters/344604

46. Janet Jackson — *Control* (1986)
   - latest rank #111
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 79648: Janet Jackson - Control (1986) — https://api.discogs.com/masters/79648
    - 79655: Janet Jackson - Control (1986) — https://api.discogs.com/masters/79655
    - 1002617: Janet Jackson = ジャネット・ジャクソン* - Control = コントロール (1986) — https://api.discogs.com/masters/1002617
    - 300916: Janet Jackson - More Control (1987) — https://api.discogs.com/masters/300916

47. Elton John — *Goodbye Yellow Brick Road* (1973)
   - latest rank #112
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 444766: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/444766
    - 30577: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/30577
    - 85563: Elton John - Goodbye Yellow Brick Road (1973) — https://api.discogs.com/masters/85563

48. The Smiths — *The Queen Is Dead* (1986)
   - latest rank #113
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1819803: The Smiths - The Queen Is Dead — https://api.discogs.com/masters/1819803
    - 20137: The Smiths - The Queen Is Dead (1986) — https://api.discogs.com/masters/20137

49. Kendrick Lamar — *good kid, m.A.A.d city* (2012)
   - latest rank #115
   - kind: review
   - reason: source-cache-without-usable-credits
   - recommended action: inspect-release-or-mark-gap
   - source candidates:
    - none

50. The Rolling Stones — *Out Of Our Heads* (1965)
   - latest rank #116
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 194321: The Rolling Stones - Out Of Our Heads (1965) — https://api.discogs.com/masters/194321
    - 54131: The Rolling Stones - Out Of Our Heads (1965) — https://api.discogs.com/masters/54131
