# Discogs credit review report

Status: generated review queue, not canonical data.

## Summary

- Comparison albums: 760
- Credit/studio candidates: 412
- Review items: 245
- Gaps: 103
- Total unresolved: 348

## Review reasons

- ambiguous-discogs-master-search-result: 216
- discogs-master-fetch-failed: 5
- source-cache-without-usable-credits: 24

## Gap reasons

- no-exact-discogs-master-search-result: 103

## How to resolve

- For `approve-master-override`, add an approved row to `data/review/discogs-credit-master-overrides.json`.
- For `add-search-alias`, add an approved row to `data/review/discogs-credit-search-aliases.json`.
- For stale Discogs IDs or empty credit caches, inspect the candidate source and either approve an alternate master, reject it, or leave the album as a documented gap.
- Re-run `npm run import:discogs-credits`, then `npm run build:discogs-credit-review`.

## Top unresolved items by latest Rolling Stone rank

1. The Clash — *London Calling* (1980)
   - latest rank #8
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1162886: The Clash - London Calling (1980) — https://api.discogs.com/masters/1162886
    - 19382: The Clash - London Calling (1979) — https://api.discogs.com/masters/19382

2. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

3. The Beatles — *The White Album* (1968)
   - latest rank #10
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

4. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

5. The Velvet Underground and Nico — *The Velvet Underground* (1967)
   - latest rank #13
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

6. The Rolling Stones — *Exile on Main Street* (1972)
   - latest rank #14
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

7. The Notorious B.I.G. — *Ready to Die* (1994)
   - latest rank #22
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

8. John Lennon — *John Lennon/Plastic Ono Band* (1970)
   - latest rank #23
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3404152: John Lennon & Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/3404152
    - 72864: John Lennon / Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/72864

9. The Beatles — *Sgt. Pepper's Lonely Hearts Club Band* (1967)
   - latest rank #24
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264303: The Beatles - Sgt. Pepper's Lonely Hearts Club Band (1967) — https://api.discogs.com/masters/1264303
    - 1264297: The Beatles - Sgt. Pepper's Lonely Hearts Club Band — https://api.discogs.com/masters/1264297
    - 1264296: The Beatles - Sgt. Pepper's Lonely Hearts Club Band (1967) — https://api.discogs.com/masters/1264296

10. The Beatles — *White Album* (1968)
   - latest rank #29
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

11. Beyoncé — *Lemonade* (2016)
   - latest rank #32
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

12. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1288169: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/1288169
    - 778503: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/778503
    - 51331: Amy Winehouse - Back To Black (2007) — https://api.discogs.com/masters/51331
    - 51256: Amy Winehouse - Back To Black (2006) — https://api.discogs.com/masters/51256

13. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 86466: Stevie Wonder - Innervisions (1973) — https://api.discogs.com/masters/86466
    - 1420033: Stevie Wonder - Innervisions (1973) — https://api.discogs.com/masters/1420033

14. The Beatles — *Rubber Soul* (1965)
   - latest rank #35
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 180084: The Beatles - Rubber Soul (1966) — https://api.discogs.com/masters/180084
    - 45526: The Beatles - Rubber Soul (1965) — https://api.discogs.com/masters/45526

15. Michael Jackson — *Off the Wall* (1979)
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

16. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263629: Dr. Dre - The Chronic — https://api.discogs.com/masters/1263629
    - 1263667: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/1263667
    - 1263627: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/1263627
    - 33951: Dr. Dre - The Chronic (1992) — https://api.discogs.com/masters/33951

17. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

18. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 767754: The Beatles - Please Please Me (1964) — https://api.discogs.com/masters/767754
    - 1306184: The Beatles - Please Please Me — https://api.discogs.com/masters/1306184
    - 45619: The Beatles - Please Please Me (1963) — https://api.discogs.com/masters/45619
    - 45362: The Beatles - Please Please Me (1963) — https://api.discogs.com/masters/45362

19. The Rolling Stones — *Let It Bleed* (1969)
   - latest rank #41
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 52967: Rolling Stones* - Let It Bleed (1969) — https://api.discogs.com/masters/52967
    - 1671216: The Rolling Stones - レット・イット・ブリード = Let It Bleed (1970) — https://api.discogs.com/masters/1671216
    - 1895529: The Rolling Stones - Honky Tonky Woman / Let It Bleed — https://api.discogs.com/masters/1895529

20. Prince — *Sign O' the Times* (1987)
   - latest rank #45
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 52776: Prince - Sign "O" The Times (1987) — https://api.discogs.com/masters/52776
    - 52497: Prince - Sign "O" The Times (1987) — https://api.discogs.com/masters/52497
    - 268038: Prince - Sign "O" The Times (1988) — https://api.discogs.com/masters/268038
    - 1341713: Prince - When Doves Cry - It's A Sign O' The Times (1988) — https://api.discogs.com/masters/1341713

21. Paul Simon — *Graceland* (1986)
   - latest rank #46
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 152341: Paul Simon - Graceland  (1986) — https://api.discogs.com/masters/152341
    - 55658: Paul Simon - Graceland (1986) — https://api.discogs.com/masters/55658

22. Bob Marley and the Wailers — *Exodus* (1977)
   - latest rank #48
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 168594: Bob Marley And The Wailers* - Exodus (1977) — https://api.discogs.com/masters/168594
    - 65858: Bob Marley & The Wailers - Exodus (1977) — https://api.discogs.com/masters/65858
    - 257657: Bob Marley & The Wailers - War/No More Trouble / Exodus (1978) — https://api.discogs.com/masters/257657

23. Bob Marley and the Wailers — *Legend* (1984)
   - latest rank #48
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

24. Jimi Hendrix — *Electric Ladyland* (1968)
   - latest rank #53
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 24535: The Jimi Hendrix Experience - Electric Ladyland (1968) — https://api.discogs.com/masters/24535
    - 2978398: The Jimi Hendrix Experience - Electric Ladyland (1969) — https://api.discogs.com/masters/2978398
    - 402399: The Jimi Hendrix Experience - Electric Ladyland — https://api.discogs.com/masters/402399

25. James Brown — *Star Time* (1991)
   - latest rank #54
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

26. Ray Charles — *The Birth of Soul: The Complete Atlantic Recordings* (1991)
   - latest rank #54
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

27. Ray Charles — *The Birth Of Soul: The Complete Atlantic Rhythm And Blues Recordings* (1991)
   - latest rank #54
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

28. Led Zeppelin — *Led Zeppelin IV* (1971)
   - latest rank #58
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

29. Creedence Clearwater Revival — *Chronicle, Vol. 1* (1976)
   - latest rank #59
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

30. Captain Beefheart and his Magic Band — *Trout Mask Replica* (1969)
   - latest rank #60
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

31. Van Morrison — *Astral Weeks* (1968)
   - latest rank #60
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 14541: Van Morrison - Astral Weeks (1968) — https://api.discogs.com/masters/14541
    - 1658411: Van Morrison - Double Dynamite: Moondance / Astral Weeks — https://api.discogs.com/masters/1658411

32. Eric B. and Rakim — *Paid in Full* (1987)
   - latest rank #61
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 12854: Eric B. & Rakim - Paid In Full (1987) — https://api.discogs.com/masters/12854
    - 12742: Eric B. & Rakim - Move The Crowd / Paid In Full (1987) — https://api.discogs.com/masters/12742

33. Guns N' Roses — *Appetite for Destruction* (1987)
   - latest rank #62
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 503823: Guns N' Roses - Appetite For Destruction — https://api.discogs.com/masters/503823
    - 9467: Guns N' Roses - Appetite For Destruction (1987) — https://api.discogs.com/masters/9467

34. Steely Dan — *Aja* (1977)
   - latest rank #63
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 16921: Steely Dan - Aja (1977) — https://api.discogs.com/masters/16921
    - 730890: Steely Dan - Black Cow / Peg / Aja (1978) — https://api.discogs.com/masters/730890

35. OutKast — *Stankonia* (2000)
   - latest rank #64
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 616158: OutKast - Stankonia (2000) — https://api.discogs.com/masters/616158
    - 1236820: OutKast - Stankonia (2000) — https://api.discogs.com/masters/1236820
    - 26124: OutKast - Stankonia (2000) — https://api.discogs.com/masters/26124

36. Phil Spector — *Back To Mono* (1991)
   - latest rank #65
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

37. Phil Spector — *Back to Mono (1958-1969)* (1991)
   - latest rank #65
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1264847: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/1264847
    - 253925: Phil Spector - Back To Mono (1958-1969) (1991) — https://api.discogs.com/masters/253925

38. Kate Bush — *Hounds of Love* (1985)
   - latest rank #68
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 28719: Kate Bush - Hounds Of Love (1986) — https://api.discogs.com/masters/28719
    - 28680: Kate Bush - Hounds Of Love (1985) — https://api.discogs.com/masters/28680

39. Alanis Morissette — *Jagged Little Pill* (1995)
   - latest rank #69
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1300279: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/1300279
    - 31513: Alanis Morissette - Jagged Little Pill (1995) — https://api.discogs.com/masters/31513

40. N.W.A — *Straight Outta Compton* (1988)
   - latest rank #70
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1263648: N.W.A. - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263648
    - 26117: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/26117
    - 1263646: N.W.A* - Straight Outta Compton (1989) — https://api.discogs.com/masters/1263646

41. Curtis Mayfield — *Super Fly* (1972)
   - latest rank #76
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 895376: Curtis Mayfield - Super Fly (1972) — https://api.discogs.com/masters/895376

42. Elvis Presley — *The Sun Sessions* (1976)
   - latest rank #78
   - kind: review
   - reason: discogs-master-fetch-failed
   - recommended action: approve-alternate-master-or-reject-stale
   - source candidates:
    - 198268: Elvis Presley - The Sun Sessions (1976) — https://api.discogs.com/masters/198268

43. Frank Ocean — *Blond* (2016)
   - latest rank #79
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

44. The Sex Pistols — *Never Mind the Bollocks Here's the Sex Pistols* (1977)
   - latest rank #80
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none

45. The Clash — *The Clash* (1979)
   - latest rank #81
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 19588: The Clash - The Clash — https://api.discogs.com/masters/19588
    - 553738: The Clash - The Clash (1979) — https://api.discogs.com/masters/553738

46. AC/DC — *Back in Black* (1980)
   - latest rank #84
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 347109: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/347109
    - 8471: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/8471
    - 324463: AC/DC - Back In Black (1980) — https://api.discogs.com/masters/324463

47. John Lennon — *Plastic Ono Band* (1970)
   - latest rank #85
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 3404152: John Lennon & Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/3404152
    - 72864: John Lennon / Plastic Ono Band* - John Lennon / Plastic Ono Band (1970) — https://api.discogs.com/masters/72864

48. The Doors — *The Doors* (1967)
   - latest rank #86
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 1339472: The Doors - The Doors — https://api.discogs.com/masters/1339472
    - 406648: The Doors - The Doors (1968) — https://api.discogs.com/masters/406648

49. Erykah Badu — *Baduizm* (1997)
   - latest rank #89
   - kind: review
   - reason: ambiguous-discogs-master-search-result
   - recommended action: approve-master-override
   - source candidates:
    - 482209: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/482209
    - 43655: Erykah Badu - Baduizm (1997) — https://api.discogs.com/masters/43655

50. Missy "Misdemeanor" Elliott — *Supa Dupa Fly* (1997)
   - latest rank #93
   - kind: gap
   - reason: no-exact-discogs-master-search-result
   - recommended action: add-search-alias
   - source candidates:
    - none
